import { createSlice } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "../store";
import { createAppAsyncThunk } from "../asyncThunk";
import RtcManager from "@whereby/jslib-media/src/webrtc/RtcManager";
import { selectSignalConnectionRaw } from "./signalConnection";
import RtcManagerDispatcher, {
    RtcEvents,
    RtcManagerCreatedPayload,
    RtcStreamAddedPayload,
} from "@whereby/jslib-media/src/webrtc/RtcManagerDispatcher";
import { createReactor } from "../listenerMiddleware";
import { StreamState } from "~/lib/RoomParticipant";
import { doParticipantStreamAdded, selectRemoteParticipants } from "./room";
import { selectAppLocalMedia } from "./app";

export interface RtcConnectionState {
    error: unknown;
    status: "" | "ready" | "reconnect";
    isCreatingDispatcher: boolean;
    dispatcherCreated: boolean;
    rtcManagerDispatcher: RtcManagerDispatcher | null;
    rtcManager: RtcManager | null;
}

const initialState: RtcConnectionState = {
    error: null,
    status: "",
    isCreatingDispatcher: false,
    dispatcherCreated: false,
    rtcManagerDispatcher: null,
    rtcManager: null,
};

export const createWebRtcEmitter = (dispatch: AppDispatch) => {
    return {
        emit: (eventName: keyof RtcEvents, data: RtcEvents[keyof RtcEvents]) => {
            if (eventName === "rtc_manager_created") {
                dispatch(doRtcManagerCreated(data as RtcManagerCreatedPayload));
            } else if (eventName === "stream_added") {
                dispatch(doStreamAdded(data as RtcStreamAddedPayload));
            } else if (eventName === "rtc_manager_destroyed") {
                dispatch(doRtcManagerDestroyed());
            } else {
                console.log(`Unhandled RTC event ${eventName}`);
            }
        },
    };
};

export const doRtcManagerCreated = createAppAsyncThunk(
    "rtcConnection/doRtcManagerCreated",
    async (payload: RtcManagerCreatedPayload, { getState, dispatch }) => {
        const { rtcManager } = payload;
        const localMedia = selectAppLocalMedia(getState());
        const remoteParticipants = selectRemoteParticipants(getState());

        localMedia?.addRtcManager(rtcManager);

        if (localMedia?.stream) {
            rtcManager.addNewStream(
                "0",
                localMedia.stream,
                !localMedia.isMicrophoneEnabled(),
                !localMedia.isCameraEnabled()
            );
        }

        if (remoteParticipants.length > 0) {
            dispatch(doHandleAcceptStreams());
        }

        return rtcManager;
    }
);

export const doStreamAdded = createAppAsyncThunk(
    "rtcConnection/doStreamAdded",
    async (payload: RtcStreamAddedPayload, { dispatch, getState, extra }) => {
        const state = getState();
        const remoteParticipants = selectRemoteParticipants(state);

        const { clientId, stream, streamId, streamType } = payload;

        if (!streamId) {
            payload.streamId = stream.id;
        }

        const remoteParticipant = remoteParticipants.find((p) => p.id === clientId);
        if (!remoteParticipant) {
            return;
        }

        const remoteParticipantStream =
            remoteParticipant.streams.find((s) => s.id === streamId) || remoteParticipant.streams[0];

        if (
            (remoteParticipant.stream && remoteParticipant.stream.id === streamId) ||
            (!remoteParticipant.stream && streamType === "webcam") ||
            (!remoteParticipant.stream && !streamType && remoteParticipant.streams.indexOf(remoteParticipantStream) < 1)
        ) {
            dispatch(doParticipantStreamAdded({ clientId, streamId: stream.id, stream, streamType }));
        }
        // update remote participant screen share stream
    }
);

export const doHandleAcceptStreams = createAppAsyncThunk(
    "rtcConnection/doHandleAcceptStreams",
    async (payload, { getState }) => {
        const state = getState();
        const rtcManager = selectRtcConnectionRaw(state).rtcManager;
        const remoteParticipants = selectRemoteParticipants(state);

        if (!rtcManager) {
            throw new Error("No rtc manager");
        }

        const shouldAcceptNewClients = rtcManager.shouldAcceptStreamsFromBothSides?.();
        const activeBreakout = false; // TODO: Remove this once breakout is implemented
        const myselfBroadcasting = false; // TODO: Remove once breakout is implemented

        remoteParticipants.forEach((participant) => {
            const { id: participantId, streams, newJoiner } = participant;

            streams.forEach((stream) => {
                const { id: streamId, state: streamState } = stream;
                let newState: StreamState | undefined = undefined;

                // Determine the new state of the client, equivalent of "reactAcceptStreams"

                const isInSameRoomOrGroupOrClientBroadcasting = true; // TODO: Remove once breakout is implemented

                if (isInSameRoomOrGroupOrClientBroadcasting) {
                    if (streamState !== "done_accept") {
                        newState = `${newJoiner && streamId === "0" ? "new" : "to"}_accept`;
                    }
                } else if (myselfBroadcasting) {
                    if (streamState !== "done_accept") {
                        newState = `${newJoiner && streamId === "0" ? "done" : "old"}_accept`;
                    }
                } else {
                    if (streamState !== "done_unaccept") {
                        newState = "to_unaccept";
                    }
                }

                if (!newState) {
                    return;
                }

                if (
                    newState === "to_accept" ||
                    (newState === "new_accept" && shouldAcceptNewClients) ||
                    (newState === "old_accept" && !shouldAcceptNewClients)
                ) {
                    console.log(`Accepting stream ${streamId} from ${participantId}`);
                    rtcManager.acceptNewStream({
                        streamId: streamId === "0" ? participantId : streamId,
                        clientId: participantId,
                        shouldAddLocalVideo: streamId === "0",
                        activeBreakout,
                    });
                } else if (newState === "new_accept" || newState === "old_accept") {
                    // do nothing - let this be marked as done_accept as the rtcManager
                    // will trigger accept from other end
                } else if (newState === "to_unaccept") {
                    console.log(`Disconnecting stream ${streamId} from ${participantId}`);
                    rtcManager.disconnect(streamId === "0" ? participantId : streamId, activeBreakout);
                } else if (newState !== "done_accept") {
                    console.warn(`Stream state not handled: ${newState} for ${participantId}-${streamId}`);
                    return;
                } else {
                    // done_accept
                }

                // Update stream state
                participant.updateStreamState(streamId, streamState.replace(/to_|new_|old_/, "done_") as StreamState);
            });
        });
    }
);

export const doConnectRtc = createAppAsyncThunk(
    "rtcConnection/doConnectRtc",
    async (payload, { dispatch, getState }) => {
        const state = getState();
        const socket = selectSignalConnectionRaw(state).socket;
        const dispatcher = selectRtcConnectionRaw(state).rtcManagerDispatcher;
        const localMedia = selectAppLocalMedia(state);

        if (dispatcher) {
            throw new Error("RTC dispatcher already exists");
        }

        const webrtcProvider = {
            getMediaConstraints: () => ({
                audio: localMedia?.isMicrophoneEnabled() || false,
                video: localMedia?.isCameraEnabled() || false,
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
            },
        });

        return rtcManagerDispatcher;
    }
);

export const rtcConnectionSlice = createSlice({
    name: "rtcConnection",
    initialState,
    reducers: {
        doRtcManagerDestroyed: (state) => {
            return {
                ...state,
                dispatcherCreated: false,
                rtcManagerDispatcher: null,
                rtcManager: null,
            };
        },
    },
    extraReducers: (builder) => {
        builder.addCase(doConnectRtc.pending, (state) => {
            return {
                ...state,
                isCreatingDispatcher: true,
            };
        });
        builder.addCase(doConnectRtc.fulfilled, (state, action) => {
            return {
                ...state,
                dispatcherCreated: true,
                rtcManagerDispatcher: action.payload,
            };
        });
        builder.addCase(doRtcManagerCreated.fulfilled, (state, action) => {
            return {
                ...state,
                rtcManager: action.payload,
                status: "ready",
            };
        });
    },
});

export const { doRtcManagerDestroyed } = rtcConnectionSlice.actions;

export const selectRtcConnectionRaw = (state: RootState) => state.rtcConnection;

createReactor((_, { dispatch, getState }) => {
    const rtcConnection = selectRtcConnectionRaw(getState());
    const signalConnection = selectSignalConnectionRaw(getState());

    if (!rtcConnection.dispatcherCreated && !rtcConnection.isCreatingDispatcher && signalConnection.socket) {
        dispatch(doConnectRtc());
    }
});

// react accept streams
createReactor((_, { dispatch, getState }) => {
    const rtcConnection = selectRtcConnectionRaw(getState());
    const oldRemoteParticipants = selectRemoteParticipants(getState());
    const remoteParticipants = selectRemoteParticipants(getState());

    if (rtcConnection.status !== "ready" || oldRemoteParticipants === remoteParticipants) {
        return;
    }

    let shouldAcceptStreams = false;

    remoteParticipants.forEach((participant) => {
        const { streams } = participant;
        const isInSameRoomOrGroupOrClientBroadcasting = true; // TODO: Remove once breakout is implemented

        streams.forEach((stream) => {
            const { state: streamState } = stream;

            if (isInSameRoomOrGroupOrClientBroadcasting) {
                if (streamState === "done_accept") return;
                shouldAcceptStreams = true;
            } else {
                if (streamState === "done_unaccept") return;
                shouldAcceptStreams = true;
            }
        });
    });

    if (shouldAcceptStreams) {
        dispatch(doHandleAcceptStreams());
    }
});
