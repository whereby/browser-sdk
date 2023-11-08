import { createSlice } from "@reduxjs/toolkit";
import { AppDispatch, RootState, createAppAsyncThunk } from "../store";
import RtcManager from "@whereby/jslib-media/src/webrtc/RtcManager";
import { selectSignalConnectionRaw } from "./signalConnection";
import RtcManagerDispatcher, {
    RtcEvents,
    RtcManagerCreatedPayload,
    RtcStreamAddedPayload,
} from "@whereby/jslib-media/src/webrtc/RtcManagerDispatcher";
import { startAppListening } from "../listenerMiddleware";
import { StreamState } from "~/lib/RoomParticipant";
import { selectRemoteParticipants } from "./room";

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

const webrtcProvider = {
    getMediaConstraints: () => ({
        audio: true,
        video: true,
    }),
    deferrable(clientId: string) {
        return !clientId;
    },
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
    async (payload: RtcManagerCreatedPayload) => {
        const { rtcManager } = payload;

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
            // return extra.dispatchEvent(
            //     new RoomConnectionEvent("participant_stream_added", {
            //         detail: { participantId: clientId, stream, streamId: streamId || "" },
            //     })
            // );
        }
        // return extra.dispatchEvent(
        //     new RoomConnectionEvent("screenshare_started", {
        //         detail: {
        //             participantId: clientId,
        //             stream,
        //             id: streamId || "",
        //             isLocal: false,
        //             hasAudioTrack: stream.getAudioTracks().length > 0,
        //         },
        //     })
        // );
    }
);

export const doHandleAcceptStreams = createAppAsyncThunk(
    "rtcConnection/doHandleAcceptStreams",
    async (payload, { dispatch, getState }) => {
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

        if (dispatcher) {
            throw new Error("RTC dispatcher already exists");
        }

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

startAppListening({
    predicate: (action, currentState) => {
        const rtcConnection = selectRtcConnectionRaw(currentState);
        const signalConnection = selectSignalConnectionRaw(currentState);

        if (
            !rtcConnection.dispatcherCreated &&
            !rtcConnection.isCreatingDispatcher &&
            signalConnection.isListeningForEvents &&
            signalConnection.socket
        ) {
            return true;
        }
        return false;
    },
    effect: (action, { dispatch, cancelActiveListeners }) => {
        cancelActiveListeners();
        dispatch(doConnectRtc());
    },
});

// react accept streams
startAppListening({
    predicate: (action, currentState, previousState) => {
        const rtcConnection = selectRtcConnectionRaw(currentState);
        const oldRemoteParticipants = selectRemoteParticipants(previousState);
        const remoteParticipants = selectRemoteParticipants(currentState);

        if (rtcConnection.status !== "ready" || oldRemoteParticipants === remoteParticipants) {
            return false;
        }

        const upd: string[] = [];

        remoteParticipants.forEach((participant) => {
            const { streams } = participant;
            const isInSameRoomOrGroupOrClientBroadcasting = true; // TODO: Remove once breakout is implemented

            streams.forEach((stream) => {
                const { id: streamId, state: streamState } = stream;

                if (isInSameRoomOrGroupOrClientBroadcasting) {
                    if (streamState === "done_accept") return;
                    upd.push(streamId);
                } else {
                    if (streamState === "done_unaccept") return;
                    upd.push(streamId);
                }
            });
        });

        return upd.length > 0;
    },
    effect: (action, { dispatch }) => {
        dispatch(doHandleAcceptStreams());
    },
});
