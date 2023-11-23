import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "../store";
import { createAppAsyncThunk, createAppThunk } from "../asyncThunk";
import RtcManager from "@whereby/jslib-media/src/webrtc/RtcManager";
import { selectSignalConnectionRaw } from "./signalConnection";
import RtcManagerDispatcher, {
    RtcEvents,
    RtcManagerCreatedPayload,
    RtcStreamAddedPayload,
} from "@whereby/jslib-media/src/webrtc/RtcManagerDispatcher";
import { createReactor } from "../listenerMiddleware";
import { StreamState } from "~/lib/RoomParticipant";
import { doParticipantStreamAdded, selectRemoteParticipants } from "./remoteParticipants";
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
                //console.log(`Unhandled RTC event ${eventName}`);
            }
        },
    };
};

export const doRtcManagerCreated = createAppAsyncThunk(
    "rtcConnection/doRtcManagerCreated",
    async (payload: RtcManagerCreatedPayload, { getState }) => {
        const { rtcManager } = payload;
        const localMedia = selectAppLocalMedia(getState());

        localMedia?.addRtcManager(rtcManager);

        if (localMedia?.stream) {
            rtcManager.addNewStream(
                "0",
                localMedia.stream,
                !localMedia.isMicrophoneEnabled(),
                !localMedia.isCameraEnabled()
            );
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

interface StreamStatusUpdate {
    clientId: string;
    streamId: string;
    state: string;
}

const doHandleAcceptStreams = createAppThunk(
    (payload: { clientId: string; streamId: string; state: string }[]) => (dispatch, getState) => {
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
            updates.push({ clientId, streamId, state: state.replace(/to_|new_|old_/, "done_") });
            //participant.updateStreamState(streamId, state.replace(/to_|new_|old_/, "done_") as StreamState);
        }

        dispatch(streamStatusUpdated(updates));
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

export const { doRtcManagerDestroyed, streamStatusUpdated } = rtcConnectionSlice.actions;

export const selectRtcConnectionRaw = (state: RootState) => state.rtcConnection;

createReactor((_, { dispatch, getState }) => {
    const rtcConnection = selectRtcConnectionRaw(getState());
    const signalConnection = selectSignalConnectionRaw(getState());

    if (!rtcConnection.dispatcherCreated && !rtcConnection.isCreatingDispatcher && signalConnection.socket) {
        dispatch(doConnectRtc());
    }
});

// react accept streams
createReactor((_, { dispatch, getState, getOriginalState }) => {
    const rtcConnection = selectRtcConnectionRaw(getState());
    const oldRemoteParticipants = selectRemoteParticipants(getOriginalState());
    const remoteParticipants = selectRemoteParticipants(getState());

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
                    state: `${newJoiner && streamId === "0" ? "new" : "to"}_accept`,
                });
            } else {
                // Already disconnected
                if (state === "done_unaccept") continue;
                upd.push({ clientId, streamId, state: "to_unaccept" });
            }
        }
    }

    if (0 < upd.length) {
        console.log("Handle accept streams");
        dispatch(doHandleAcceptStreams(upd));
    }
});
