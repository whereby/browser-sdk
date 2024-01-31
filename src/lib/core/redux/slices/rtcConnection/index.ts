import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "../../store";
import { createAppThunk } from "../../thunk";
import RtcManager from "@whereby/jslib-media/src/webrtc/RtcManager";
import { selectSignalConnectionRaw, selectSignalConnectionSocket, socketReconnecting } from "../signalConnection";
import RtcManagerDispatcher, {
    RtcEvents,
    RtcManagerCreatedPayload,
    RtcStreamAddedPayload,
} from "@whereby/jslib-media/src/webrtc/RtcManagerDispatcher";
import { createReactor, startAppListening } from "../../listenerMiddleware";
import { selectRemoteParticipants, streamStatusUpdated } from "../remoteParticipants";
import { StreamState } from "../../../../../lib/core/RoomParticipant";
import { selectAppIsNodeSdk, selectAppWantsToJoin } from "../app";
import {
    selectIsCameraEnabled,
    selectIsMicrophoneEnabled,
    selectLocalMediaStream,
    selectLocalMediaStatus,
    doSetDevice,
} from "../localMedia";
import { rtcEvents } from "./actions";
import { StreamStatusUpdate } from "./types";
import { signalEvents } from "../signalConnection/actions";
import { doStartScreenshare, stopScreenshare } from "../localScreenshare";
import { Chrome111 as MediasoupDeviceHandler } from "mediasoup-client/lib/handlers/Chrome111";

export const createWebRtcEmitter = (dispatch: AppDispatch) => {
    return {
        emit: (eventName: keyof RtcEvents, data: RtcEvents[keyof RtcEvents]) => {
            if (eventName === "rtc_manager_created") {
                dispatch(doRtcManagerCreated(data as RtcManagerCreatedPayload));
            } else if (eventName === "stream_added") {
                dispatch(rtcEvents.streamAdded(data as RtcStreamAddedPayload));
            } else if (eventName === "rtc_manager_destroyed") {
                dispatch(rtcManagerDestroyed());
            } else {
                //console.log(`Unhandled RTC event ${eventName}`);
            }
        },
    };
};

/**
 * Reducer
 */

interface StreamResolutionUpdate {
    streamId: string;
    width: number;
    height: number;
}

export interface RtcConnectionState {
    dispatcherCreated: boolean;
    error: unknown;
    isCreatingDispatcher: boolean;
    reportedStreamResolutions: {
        [streamId: string]: Omit<StreamResolutionUpdate, "streamId">;
    };
    rtcManager: RtcManager | null;
    rtcManagerDispatcher: RtcManagerDispatcher | null;
    rtcManagerInitialized: boolean;
    status: "" | "ready" | "reconnect";
    isAcceptingStreams: boolean;
}

const initialState: RtcConnectionState = {
    dispatcherCreated: false,
    error: null,
    isCreatingDispatcher: false,
    reportedStreamResolutions: {},
    rtcManager: null,
    rtcManagerDispatcher: null,
    rtcManagerInitialized: false,
    status: "",
    isAcceptingStreams: false,
};

export const rtcConnectionSlice = createSlice({
    name: "rtcConnection",
    initialState,
    reducers: {
        isAcceptingStreams: (state, action: PayloadAction<boolean>) => {
            return {
                ...state,
                isAcceptingStreams: action.payload,
            };
        },
        resolutionReported: (state, action: PayloadAction<StreamResolutionUpdate>) => {
            const { streamId, width, height } = action.payload;

            return {
                ...state,
                reportedStreamResolutions: {
                    ...state.reportedStreamResolutions,
                    [streamId]: { width, height },
                },
            };
        },
        rtcDisconnected: () => {
            return {
                ...initialState,
            };
        },
        rtcDispatcherCreated: (state, action: PayloadAction<RtcManagerDispatcher>) => {
            return {
                ...state,
                dispatcherCreated: true,
                rtcManagerDispatcher: action.payload,
            };
        },
        rtcManagerCreated: (state, action: PayloadAction<RtcManager>) => {
            return {
                ...state,
                rtcManager: action.payload,
                status: "ready",
            };
        },
        rtcManagerDestroyed: (state) => {
            return {
                ...state,
                rtcManager: null,
            };
        },
        rtcManagerInitialized: (state) => {
            return {
                ...state,
                rtcManagerInitialized: true,
            };
        },
    },
    extraReducers: (builder) => {
        builder.addCase(socketReconnecting, (state) => {
            return {
                ...state,
                status: "reconnect",
            };
        });
        builder.addCase(signalEvents.roomJoined, (state) => {
            return {
                ...state,
                status: state.status === "reconnect" ? "ready" : state.status,
            };
        });
    },
});

/**
 * Action creators
 */

export const {
    resolutionReported,
    rtcDispatcherCreated,
    rtcDisconnected,
    rtcManagerCreated,
    rtcManagerDestroyed,
    rtcManagerInitialized,
    isAcceptingStreams,
} = rtcConnectionSlice.actions;

export const doConnectRtc = createAppThunk(() => (dispatch, getState) => {
    const state = getState();
    const socket = selectSignalConnectionRaw(state).socket;
    const dispatcher = selectRtcConnectionRaw(state).rtcManagerDispatcher;
    const isCameraEnabled = selectIsCameraEnabled(state);
    const isMicrophoneEnabled = selectIsMicrophoneEnabled(state);
    const isNodeSdk = selectAppIsNodeSdk(state);

    if (dispatcher) {
        return;
    }

    const webrtcProvider = {
        getMediaConstraints: () => ({
            audio: isMicrophoneEnabled,
            video: isCameraEnabled,
        }),
        deferrable(clientId: string) {
            return !clientId;
        },
    };

    const rtcManagerDispatcher = new RtcManagerDispatcher({
        emitter: createWebRtcEmitter(dispatch),
        serverSocket: socket,
        logger: console,
        webrtcProvider,
        features: {
            lowDataModeEnabled: false,
            sfuServerOverrideHost: undefined,
            turnServerOverrideHost: undefined,
            useOnlyTURN: undefined,
            vp9On: false,
            h264On: false,
            simulcastScreenshareOn: false,
            deviceHandlerFactory: isNodeSdk ? MediasoupDeviceHandler.createFactory() : undefined,
        },
    });

    dispatch(rtcDispatcherCreated(rtcManagerDispatcher));
});

export const doDisconnectRtc = createAppThunk(() => (dispatch, getState) => {
    const { rtcManager } = selectRtcConnectionRaw(getState());
    if (rtcManager) {
        rtcManager.disconnectAll();
    }
    dispatch(rtcDisconnected());
});

export const doHandleAcceptStreams = createAppThunk((payload: StreamStatusUpdate[]) => (dispatch, getState) => {
    dispatch(isAcceptingStreams(true));
    const state = getState();
    const rtcManager = selectRtcConnectionRaw(state).rtcManager;
    const remoteParticipants = selectRemoteParticipants(state);

    if (!rtcManager) {
        throw new Error("No rtc manager");
    }

    const activeBreakout = false;
    const shouldAcceptNewClients = rtcManager.shouldAcceptStreamsFromBothSides?.();

    const updates: StreamStatusUpdate[] = [];

    for (const { clientId, streamId, state } of payload) {
        const participant = remoteParticipants.find((p) => p.id === clientId);
        if (!participant) continue;
        if (
            state === "to_accept" ||
            (state === "new_accept" && shouldAcceptNewClients) ||
            (state === "old_accept" && !shouldAcceptNewClients) // these are done to enable broadcast in legacy/p2p
        ) {
            rtcManager.acceptNewStream({
                streamId: streamId === "0" ? clientId : streamId,
                clientId,
                shouldAddLocalVideo: streamId === "0",
                activeBreakout,
            });
        } else if (state === "new_accept" || state === "old_accept") {
            // do nothing - let this be marked as done_accept as the rtcManager
            // will trigger accept from other end
        } else if (state === "to_unaccept") {
            rtcManager?.disconnect(streamId === "0" ? clientId : streamId, activeBreakout);
        } else if (state !== "done_accept") {
            continue;
            // console.warn(`Stream state not handled: ${state} for ${clientId}-${streamId}`);
        } else {
            // done_accept
        }
        updates.push({ clientId, streamId, state: state.replace(/to_|new_|old_/, "done_") as StreamState });
    }

    dispatch(streamStatusUpdated(updates));
    dispatch(isAcceptingStreams(false));
});

export const doRtcReportStreamResolution = createAppThunk(
    ({ streamId, width, height }: StreamResolutionUpdate) =>
        (dispatch, getState) => {
            const { reportedStreamResolutions, rtcManager } = selectRtcConnectionRaw(getState());
            const localStream = selectLocalMediaStream(getState());

            if (!rtcManager || localStream?.id === streamId) {
                return;
            }

            const old = reportedStreamResolutions[streamId];
            if (!old || old.width !== width || old.height !== height) {
                rtcManager.updateStreamResolution(streamId, null, { width: width || 1, height: height || 1 });
            }

            dispatch(resolutionReported({ streamId, width, height }));
        }
);

export const doRtcManagerCreated = createAppThunk((payload: RtcManagerCreatedPayload) => (dispatch) => {
    const { rtcManager } = payload;
    dispatch(rtcManagerCreated(rtcManager));
});

export const doRtcManagerInitialize = createAppThunk(() => (dispatch, getState) => {
    const localMediaStream = selectLocalMediaStream(getState());
    const rtcManager = selectRtcConnectionRaw(getState()).rtcManager;
    const isCameraEnabled = selectIsCameraEnabled(getState());
    const isMicrophoneEnabled = selectIsMicrophoneEnabled(getState());

    if (localMediaStream && rtcManager) {
        rtcManager.addNewStream("0", localMediaStream, !isMicrophoneEnabled, !isCameraEnabled);
    }

    dispatch(rtcManagerInitialized());
});

/**
 * Selectors
 */

export const selectRtcConnectionRaw = (state: RootState) => state.rtcConnection;
export const selectRtcManagerInitialized = (state: RootState) => state.rtcConnection.rtcManagerInitialized;
export const selectRtcManager = (state: RootState) => state.rtcConnection.rtcManager;
export const selectRtcDispatcherCreated = (state: RootState) => state.rtcConnection.dispatcherCreated;
export const selectRtcIsCreatingDispatcher = (state: RootState) => state.rtcConnection.isCreatingDispatcher;
export const selectRtcStatus = (state: RootState) => state.rtcConnection.status;
export const selectIsAcceptingStreams = (state: RootState) => state.rtcConnection.isAcceptingStreams;

/**
 * Reactors
 */

startAppListening({
    actionCreator: doSetDevice.fulfilled,
    effect: ({ payload }, { getState }) => {
        const { replacedTracks } = payload;
        const { rtcManager } = selectRtcConnectionRaw(getState());
        const stream = selectLocalMediaStream(getState());

        const replace = (kind: string, oldTrack: MediaStreamTrack) => {
            const track = stream?.getTracks().find((t) => t.kind === kind);
            return track && rtcManager?.replaceTrack(oldTrack, track);
        };

        replacedTracks?.forEach((t) => {
            replace(t.kind, t);
        });
    },
});

startAppListening({
    actionCreator: doStartScreenshare.fulfilled,
    effect: ({ payload }, { getState }) => {
        const { stream } = payload;
        const { rtcManager } = selectRtcConnectionRaw(getState());

        rtcManager?.addNewStream(stream.id, stream, false, true);
    },
});

startAppListening({
    actionCreator: stopScreenshare,
    effect: ({ payload }, { getState }) => {
        const { stream } = payload;
        const { rtcManager } = selectRtcConnectionRaw(getState());

        rtcManager?.removeStream(stream.id, stream, null);
    },
});

export const selectShouldConnectRtc = createSelector(
    selectRtcDispatcherCreated,
    selectRtcIsCreatingDispatcher,
    selectSignalConnectionSocket,
    (dispatcherCreated, isCreatingDispatcher, signalSocket) => {
        if (!dispatcherCreated && !isCreatingDispatcher && signalSocket) {
            return true;
        }
        return false;
    }
);

createReactor([selectShouldConnectRtc], ({ dispatch }, shouldConnectRtc) => {
    if (shouldConnectRtc) {
        dispatch(doConnectRtc());
    }
});

export const selectShouldInitializeRtc = createSelector(
    selectRtcManager,
    selectRtcManagerInitialized,
    selectLocalMediaStatus,
    (rtcManager, rtcManagerInitialized, localMediaStatus) => {
        if (localMediaStatus === "started" && rtcManager && !rtcManagerInitialized) {
            return true;
        }
        return false;
    }
);

createReactor([selectShouldInitializeRtc], ({ dispatch }, shouldInitializeRtc) => {
    if (shouldInitializeRtc) {
        dispatch(doRtcManagerInitialize());
    }
});

// Disonnect and clean up

export const selectShouldDisconnectRtc = createSelector(
    selectRtcStatus,
    selectAppWantsToJoin,
    (status, wantsToJoin) => {
        if (!wantsToJoin && !["", "disconnected"].includes(status)) {
            return true;
        }
        return false;
    }
);

createReactor([selectShouldDisconnectRtc], ({ dispatch }, shouldDisconnectRtc) => {
    if (shouldDisconnectRtc) {
        dispatch(doDisconnectRtc());
    }
});

// react accept streams
export const selectStreamsToAccept = createSelector(
    selectRtcStatus,
    selectRemoteParticipants,
    (rtcStatus, remoteParticipants) => {
        if (rtcStatus !== "ready") {
            return [];
        }

        const shouldAcceptStreams = true;
        const upd = [];
        // This should actually use remoteClientViews for its handling
        for (const client of remoteParticipants) {
            const { streams, id: clientId, newJoiner } = client;

            for (let i = 0; i < streams.length; i++) {
                const streamId = streams[i].id;
                const state = streams[i].state;
                if (shouldAcceptStreams) {
                    // Already connected
                    if (state === "done_accept") continue;
                    upd.push({
                        clientId,
                        streamId,
                        state: `${newJoiner && streamId === "0" ? "new" : "to"}_accept` as StreamState,
                    });
                } else {
                    // Already disconnected
                    if (state === "done_unaccept") continue;
                    upd.push({ clientId, streamId, state: "to_unaccept" as StreamState });
                }
            }
        }
        return upd;
    }
);

createReactor(
    [selectStreamsToAccept, selectIsAcceptingStreams],
    ({ dispatch }, streamsToAccept, isAcceptingStreams) => {
        if (0 < streamsToAccept.length && !isAcceptingStreams) {
            dispatch(doHandleAcceptStreams(streamsToAccept));
        }
    }
);
