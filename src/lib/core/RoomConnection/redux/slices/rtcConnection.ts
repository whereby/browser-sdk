import { AnyAction, createAction, createSlice, PayloadAction, ThunkDispatch } from "@reduxjs/toolkit";
import { RootState } from "../../../redux/store";
import { createAppThunk } from "../../../redux/thunk";
import RtcManager from "@whereby/jslib-media/src/webrtc/RtcManager";
import { selectSignalConnectionRaw } from "./signalConnection";
import RtcManagerDispatcher, {
    RtcEvents,
    RtcManagerCreatedPayload,
    RtcStreamAddedPayload,
} from "@whereby/jslib-media/src/webrtc/RtcManagerDispatcher";
import { createReactor } from "../../../redux/listenerMiddleware";
import { selectRemoteParticipants, streamStatusUpdated } from "./remoteParticipants";
import { StreamState } from "~/lib/RoomParticipant";
import { selectAppWantsToJoin } from "./app";
import {
    selectIsCameraEnabled,
    selectIsMicrophoneEnabled,
    selectLocalMediaStream,
    selectLocalMediaStatus,
} from "../../../LocalMedia/slices/localMedia";

function createRtcEventAction<T>(name: string) {
    return createAction<T>(`rtcConnection/event/${name}`);
}

export const rtcEvents = {
    rtcManagerCreated: createRtcEventAction<RtcManagerCreatedPayload>("rtcManagerCreated"),
    rtcManagerDestroyed: createRtcEventAction<void>("rtcManagerDestroyed"),
    streamAdded: createRtcEventAction<RtcStreamAddedPayload>("streamAdded"),
};

export const createWebRtcEmitter = (dispatch: ThunkDispatch<RootState, unknown, AnyAction>) => {
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

export interface RtcConnectionState {
    dispatcherCreated: boolean;
    error: unknown;
    isCreatingDispatcher: boolean;
    rtcManager: RtcManager | null;
    rtcManagerDispatcher: RtcManagerDispatcher | null;
    rtcManagerInitialized: boolean;
    status: "" | "ready" | "reconnect";
}

const initialState: RtcConnectionState = {
    dispatcherCreated: false,
    error: null,
    isCreatingDispatcher: false,
    rtcManager: null,
    rtcManagerDispatcher: null,
    rtcManagerInitialized: false,
    status: "",
};

export interface StreamStatusUpdate {
    clientId: string;
    streamId: string;
    state: StreamState;
}

export const rtcConnectionSlice = createSlice({
    name: "rtcConnection",
    initialState,
    reducers: {
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
                dispatcherCreated: false,
                rtcManagerDispatcher: null,
                rtcManager: null,
                rtcManagerInitialized: false,
            };
        },
        rtcManagerInitialized: (state) => {
            return {
                ...state,
                rtcManagerInitialized: true,
            };
        },
    },
});

/**
 * Action creators
 */

export const { rtcDispatcherCreated, rtcDisconnected, rtcManagerCreated, rtcManagerDestroyed, rtcManagerInitialized } =
    rtcConnectionSlice.actions;

export const doConnectRtc = createAppThunk(() => (dispatch, getState) => {
    const state = getState();
    const socket = selectSignalConnectionRaw(state).socket;
    const dispatcher = selectRtcConnectionRaw(state).rtcManagerDispatcher;
    const isCameraEnabled = selectIsCameraEnabled(state);
    const isMicrophoneEnabled = selectIsMicrophoneEnabled(state);

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

const doHandleAcceptStreams = createAppThunk((payload: StreamStatusUpdate[]) => (dispatch, getState) => {
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
});

export const doRtcManagerCreated = createAppThunk((payload: RtcManagerCreatedPayload) => (dispatch, getState) => {
    const { rtcManager } = payload;
    //const localMedia = selectLocalMediaInstance(getState());

    //localMedia?.addRtcManager(rtcManager);

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

/**
 * Reactors
 */

createReactor([selectRtcConnectionRaw, selectSignalConnectionRaw], ({ dispatch }, rtcConnection, signalConnection) => {
    if (!rtcConnection.dispatcherCreated && !rtcConnection.isCreatingDispatcher && signalConnection.socket) {
        dispatch(doConnectRtc());
    }
});

createReactor(
    [selectRtcConnectionRaw, selectLocalMediaStatus],
    ({ dispatch }, { rtcManager, rtcManagerInitialized }, localMediaStatus) => {
        if (localMediaStatus === "started" && rtcManager && !rtcManagerInitialized) {
            dispatch(doRtcManagerInitialize());
        }
    }
);

// Disonnect and clean up
createReactor([selectRtcConnectionRaw, selectAppWantsToJoin], ({ dispatch }, { status }, wantsToJoin) => {
    if (!wantsToJoin && !["", "disconnected"].includes(status)) {
        dispatch(doDisconnectRtc());
    }
});

// react accept streams
createReactor([selectRtcConnectionRaw, selectRemoteParticipants], ({ dispatch }, rtcConnection, remoteParticipants) => {
    if (rtcConnection.status !== "ready") {
        return;
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
    if (0 < upd.length) {
        dispatch(doHandleAcceptStreams(upd));
    }
});
