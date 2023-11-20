import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState, createAppAsyncThunk } from "../store";
import {
    AudioEnabledEvent,
    ClientLeftEvent,
    ClientMetadataReceivedEvent,
    KnockAcceptedEvent,
    KnockRejectedEvent,
    KnockerLeftEvent,
    NewClientEvent,
    RoomJoinedEvent,
    RoomKnockedEvent,
    VideoEnabledEvent,
    ScreenshareStartedEvent,
    ScreenshareStoppedEvent,
} from "@whereby/jslib-media/src/utils/ServerSocket";
import { doRoomConnectionStatusChanged } from "./roomConnection";
import { RemoteParticipant, WaitingParticipant, LocalParticipant } from "../../../../RoomParticipant";
import { doHandleAcceptStreams, doRtcManagerDestroyed, selectRtcConnectionRaw } from "./rtcConnection";
import { doSignalDisconnect, doSignalJoinRoom, selectSignalConnectionRaw } from "./signalConnection";
import { doAppSetRoomKey, selectAppLocalMedia } from "./app";
import { startAppListening } from "../listenerMiddleware";
import { RtcStreamAddedPayload } from "@whereby/jslib-media/src/webrtc/RtcManagerDispatcher";
import { Screenshare } from "~/lib/react";
import { doSetLocalParticipant, selectSelfId } from "./localParticipant";
import { doHandleRecorderClientJoined } from "./cloudRecording";

const NON_PERSON_ROLES = ["recorder", "streamer"];

function updateParticipant(
    remoteParticipants: RemoteParticipant[],
    participantId: string,
    updates: Partial<RemoteParticipant>
): RemoteParticipant[] {
    const existingParticipant = remoteParticipants.find((p) => p.id === participantId);
    if (!existingParticipant) {
        return remoteParticipants;
    }
    const index = remoteParticipants.indexOf(existingParticipant);

    return [
        ...remoteParticipants.slice(0, index),
        {
            ...existingParticipant,
            ...updates,
            addStream: updates.addStream ? updates.addStream : existingParticipant.addStream,
            removeStream: updates.removeStream ? updates.removeStream : existingParticipant.removeStream,
            updateStreamState: updates.updateStreamState
                ? updates.updateStreamState
                : existingParticipant.updateStreamState,
        },
        ...remoteParticipants.slice(index + 1),
    ];
}

export interface RoomState {
    remoteParticipants: RemoteParticipant[];
    waitingParticipants: WaitingParticipant[];
    screenshares: Screenshare[];
}

const initialState: RoomState = {
    remoteParticipants: [],
    waitingParticipants: [],
    screenshares: [],
};

export const doRoomJoined = createAppAsyncThunk(
    "room/doRoomJoined",
    async (payload: RoomJoinedEvent, { dispatch, getState }) => {
        const { error, isLocked, room, selfId } = payload;
        const localMedia = selectAppLocalMedia(getState());

        if (error === "room_locked" && isLocked) {
            dispatch(doRoomConnectionStatusChanged({ status: "room_locked" }));
        }

        if (room) {
            const { clients, knockers } = room;

            const localClient = clients.find((c) => c.id === selfId);
            if (!localClient) throw new Error("Missing local client");

            const recorderClient = clients.find((c) => c.role.roleName === "recorder");
            if (recorderClient) {
                dispatch(doHandleRecorderClientJoined({ client: recorderClient }));
            }

            // const streamerClient = clients.find((c) => c.role.roleName === "streamer");
            // if (streamerClient) {
            //     this._handleStreamingStarted();
            // }

            const remoteParticipants = clients
                .filter((c) => c.id !== selfId)
                .filter((c) => !NON_PERSON_ROLES.includes(c.role.roleName))
                .map((c) => new RemoteParticipant({ ...c, newJoiner: false }));

            const localParticipant = new LocalParticipant({ ...localClient, stream: localMedia?.stream || undefined });

            dispatch(doSetLocalParticipant(localParticipant));

            return {
                localParticipant,
                remoteParticipants,
                waitingParticipants: knockers.map((knocker) => ({
                    id: knocker.clientId,
                    displayName: knocker.displayName,
                })),
            };
        }
    }
);

export const doRoomLeft = createAppAsyncThunk("room/doRoomLeft", async (payload, { dispatch, getState }) => {
    dispatch(doRoomConnectionStatusChanged({ status: "disconnecting" }));
    const state = getState();
    const rtcManager = selectRtcConnectionRaw(state).rtcManager;
    const socket = selectSignalConnectionRaw(state).socket;
    const localMedia = selectAppLocalMedia(state);

    localMedia?.stop();

    if (rtcManager) {
        localMedia?.removeRtcManager(rtcManager);
        rtcManager.disconnectAll();
    }

    dispatch(doRtcManagerDestroyed());

    if (socket) {
        dispatch(doSignalDisconnect());
    }
});

export const doHandleKnockHandled = createAppAsyncThunk(
    "room/doHandleKnockHandled",
    async (payload: KnockAcceptedEvent | KnockRejectedEvent, { dispatch, getState }) => {
        const { clientId, resolution } = payload;
        const state = getState();
        const selfId = selectSelfId(state);

        if (selfId !== clientId) {
            return;
        }

        if (resolution === "accepted") {
            dispatch(doAppSetRoomKey(payload.metadata.roomKey));
            dispatch(doSignalJoinRoom());
        } else if (resolution === "rejected") {
            dispatch(doRoomConnectionStatusChanged({ status: "knock_rejected" }));
        }
    }
);

export const doHandleScreenshareStarted = createAppAsyncThunk(
    "room/doHandleScreenshareStarted",
    async (payload: ScreenshareStartedEvent, { dispatch, getState }) => {
        const { clientId: participantId, streamId: id, hasAudioTrack } = payload;
        const remoteParticipants = selectRemoteParticipants(getState());
        const participant = remoteParticipants.find((p) => p.id === participantId);

        if (!participant) {
            return;
        }

        const foundScreenshare = selectScreenshares(getState()).find((s) => s.id === id);
        if (foundScreenshare) {
            return;
        }

        participant.addStream(id, "to_accept");
        dispatch(doHandleAcceptStreams());

        return {
            participantId,
            id,
            hasAudioTrack,
            stream: undefined,
            isLocal: false,
        };
    }
);

export const doHandleScreenshareStopped = createAppAsyncThunk(
    "room/doHandleScreenshareStopped",
    async (payload: ScreenshareStoppedEvent, { getState }) => {
        const { clientId: participantId, streamId: id } = payload;
        const remoteParticipants = selectRemoteParticipants(getState());
        const participant = remoteParticipants.find((p) => p.id === participantId);

        if (!participant) {
            return;
        }

        participant.removeStream(id);

        return id;
    }
);

export const doAcceptWaitingParticipant = createAppAsyncThunk(
    "room/doAcceptWaitingParticipant",
    async (payload: { participantId: string }, { getState }) => {
        const { participantId } = payload;
        const state = getState();
        const socket = selectSignalConnectionRaw(state).socket;

        socket?.emit("handle_knock", {
            action: "accept",
            clientId: participantId,
            response: {},
        });
    }
);

export const doRejectWaitingParticipant = createAppAsyncThunk(
    "room/doRejectWaitingParticipant",
    async (payload: { participantId: string }, { getState }) => {
        const { participantId } = payload;
        const state = getState();
        const socket = selectSignalConnectionRaw(state).socket;

        socket?.emit("handle_knock", {
            action: "reject",
            clientId: participantId,
            response: {},
        });
    }
);

export const doHandleNewClient = createAppAsyncThunk(
    "room/doHandleNewClient",
    async (payload: NewClientEvent, { dispatch }) => {
        const { client } = payload;

        if (client.role.roleName === "recorder") {
            dispatch(doHandleRecorderClientJoined({ client }));
        }
        if (client.role.roleName === "streamer") {
            // this._handleStreamingStarted();
        }
        if (NON_PERSON_ROLES.includes(client.role.roleName)) {
            return;
        }
        const remoteParticipant = new RemoteParticipant({ ...client, newJoiner: true });

        return {
            remoteParticipant,
        };
    }
);

export const roomSlice = createSlice({
    name: "room",
    initialState,
    reducers: {
        doParticipantStreamAdded: (state, action: PayloadAction<RtcStreamAddedPayload>) => {
            const { clientId, stream } = action.payload;
            const remoteParticipant = state.remoteParticipants.find((p) => p.id === clientId);

            if (!remoteParticipant) {
                return state;
            }

            return {
                ...state,
                remoteParticipants: updateParticipant(state.remoteParticipants, clientId, { stream }),
            };
        },
        doParticipantAudioEnabled: (state, action: PayloadAction<AudioEnabledEvent>) => {
            const { clientId, isAudioEnabled } = action.payload;
            const remoteParticipant = state.remoteParticipants.find((p) => p.id === clientId);

            if (!remoteParticipant) {
                return state;
            }

            return {
                ...state,
                remoteParticipants: updateParticipant(state.remoteParticipants, clientId, {
                    isAudioEnabled,
                }),
            };
        },
        doParticipantVideoEnabled: (state, action: PayloadAction<VideoEnabledEvent>) => {
            const { clientId, isVideoEnabled } = action.payload;
            const remoteParticipant = state.remoteParticipants.find((p) => p.id === clientId);

            if (!remoteParticipant) {
                return state;
            }

            return {
                ...state,
                remoteParticipants: updateParticipant(state.remoteParticipants, clientId, {
                    isVideoEnabled,
                }),
            };
        },
        doParticipantMetadataChanged: (state, action: PayloadAction<ClientMetadataReceivedEvent>) => {
            const { clientId, displayName } = action.payload.payload;
            const remoteParticipant = state.remoteParticipants.find((p) => p.id === clientId);

            if (!remoteParticipant) {
                return state;
            }

            return {
                ...state,
                remoteParticipants: updateParticipant(state.remoteParticipants, clientId, {
                    displayName,
                }),
            };
        },
        doHandleClientLeft: (state, action: PayloadAction<ClientLeftEvent>) => {
            const { clientId } = action.payload;
            const remoteParticipants = state.remoteParticipants.filter((p) => p.id !== clientId);

            return {
                ...state,
                remoteParticipants,
            };
        },
        doHandleWaitingParticipantJoined: (state, action: PayloadAction<RoomKnockedEvent>) => {
            const { clientId, displayName } = action.payload;

            return {
                ...state,
                waitingParticipants: [...state.waitingParticipants, { id: clientId, displayName }],
            };
        },
        doHandleWaitingParticipantLeft: (state, action: PayloadAction<KnockerLeftEvent>) => {
            const { clientId } = action.payload;
            const waitingParticipants = state.waitingParticipants.filter((p) => p.id !== clientId);

            return {
                ...state,
                waitingParticipants,
            };
        },
        doAddScreenshare: (state, action: PayloadAction<Screenshare>) => {
            return {
                ...state,
                screenshares: [...state.screenshares, action.payload],
            };
        },
        doRemoveScreenshare: (state, action: PayloadAction<string>) => {
            return {
                ...state,
                screenshares: state.screenshares.filter((s) => s.id !== action.payload),
            };
        },
    },
    extraReducers: (builder) => {
        builder.addCase(doRoomJoined.fulfilled, (state, action) => {
            if (!action.payload) return state;

            return {
                ...state,
                localParticipant: action.payload.localParticipant,
                remoteParticipants: action.payload.remoteParticipants,
                waitingParticipants: action.payload.waitingParticipants,
            };
        });
        builder.addCase(doHandleScreenshareStarted.fulfilled, (state, action) => {
            if (!action.payload) return state;

            return {
                ...state,
                screenshares: [...state.screenshares, action.payload],
            };
        });
        builder.addCase(doHandleScreenshareStopped.fulfilled, (state, action) => {
            if (!action.payload) return state;

            return {
                ...state,
                screenshares: state.screenshares.filter((s) => s.id !== action.payload),
            };
        });
        builder.addCase(doHandleNewClient.fulfilled, (state, action) => {
            if (!action.payload) return state;

            return {
                ...state,
                remoteParticipants: [...state.remoteParticipants, action.payload.remoteParticipant],
            };
        });
    },
});

export const {
    doParticipantStreamAdded,
    doParticipantAudioEnabled,
    doParticipantVideoEnabled,
    doParticipantMetadataChanged,
    doHandleClientLeft,
    doHandleWaitingParticipantJoined,
    doHandleWaitingParticipantLeft,
    doAddScreenshare,
    doRemoveScreenshare,
} = roomSlice.actions;

export const selectRoomRaw = (state: RootState) => state.room;
export const selectRemoteParticipants = (state: RootState) => state.room.remoteParticipants;
export const selectWaitingParticipants = (state: RootState) => state.room.waitingParticipants;
export const selectScreenshares = (state: RootState) => state.room.screenshares;

startAppListening({
    actionCreator: doRoomJoined.fulfilled,
    effect: (action, { dispatch }) => {
        dispatch(doRoomConnectionStatusChanged({ status: "connected" }));
    },
});
