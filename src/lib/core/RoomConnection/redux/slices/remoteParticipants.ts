import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { createAppAsyncThunk } from "../asyncThunk";
import {
    AudioEnabledEvent,
    ClientLeftEvent,
    ClientMetadataReceivedEvent,
    NewClientEvent,
    VideoEnabledEvent,
} from "@whereby/jslib-media/src/utils/ServerSocket";
import { RemoteParticipant, StreamState } from "~/lib/RoomParticipant";
import { StreamStatusUpdate } from "./rtcConnection";
import { signalEvents } from "./signalConnection";
import { RtcStreamAddedPayload } from "@whereby/jslib-media/src/webrtc/RtcManagerDispatcher";
import { doHandleRecorderClientJoined } from "./cloudRecording";

const NON_PERSON_ROLES = ["recorder", "streamer"];

function findParticipant(state: RemoteParticipantState, participantId: string) {
    const index = state.remoteParticipants.findIndex((c) => c.id === participantId);
    return { index, participant: state.remoteParticipants[index] };
}

function updateParticipant(state: RemoteParticipantState, participantId: string, updates: Partial<RemoteParticipant>) {
    const { participant, index } = findParticipant(state, participantId);

    if (!participant) {
        console.error(`Did not find client for update ${participantId}`);
        return state;
    }

    return {
        ...state,
        remoteParticipants: [
            ...state.remoteParticipants.slice(0, index),
            { ...participant, ...updates },
            ...state.remoteParticipants.slice(index + 1),
        ],
    };
}

function updateStreamState(
    state: RemoteParticipantState,
    participantId: string,
    streamId: string,
    state_: StreamState
) {
    const { participant } = findParticipant(state, participantId);
    if (!participant) {
        console.error(`No client ${participantId} found to update stream ${streamId} ${state_}`);
        return state;
    }

    const streams = [...participant.streams];
    const idIdx = streams.findIndex((s) => s.id === streamId);
    streams[idIdx] = { ...streams[idIdx], state: state_ };

    return updateParticipant(state, participantId, { streams });
}

export interface RemoteParticipantState {
    remoteParticipants: RemoteParticipant[];
}

const initialState: RemoteParticipantState = {
    remoteParticipants: [],
};

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
        const remoteParticipant: RemoteParticipant = {
            id: client.id,
            displayName: client.displayName,
            isAudioEnabled: client.isAudioEnabled,
            isVideoEnabled: client.isVideoEnabled,
            isLocalParticipant: false,
            stream: null,
            streams: client.streams.map((streamId) => ({ id: streamId, state: "new_accept" })),
            newJoiner: true,
        };

        return {
            remoteParticipant,
        };
    }
);

export const remoteParticipantsSlice = createSlice({
    name: "remoteParticipants",
    initialState,
    reducers: {
        streamStatusUpdated: (state, action: PayloadAction<StreamStatusUpdate[]>) => {
            let newState = state;

            action.payload.forEach((update) => {
                newState = updateStreamState(newState, update.clientId, update.streamId, update.state);
            });

            return newState;
        },
        doParticipantStreamAdded: (state, action: PayloadAction<RtcStreamAddedPayload>) => {
            const { clientId, stream } = action.payload;
            const remoteParticipant = state.remoteParticipants.find((p) => p.id === clientId);

            if (!remoteParticipant) {
                return state;
            }

            return updateParticipant(state, clientId, {
                stream,
            });
        },
        doParticipantAudioEnabled: (state, action: PayloadAction<AudioEnabledEvent>) => {
            const { clientId, isAudioEnabled } = action.payload;
            const remoteParticipant = state.remoteParticipants.find((p) => p.id === clientId);

            if (!remoteParticipant) {
                return state;
            }

            return updateParticipant(state, clientId, {
                isAudioEnabled,
            });
        },
        doParticipantVideoEnabled: (state, action: PayloadAction<VideoEnabledEvent>) => {
            const { clientId, isVideoEnabled } = action.payload;
            const remoteParticipant = state.remoteParticipants.find((p) => p.id === clientId);

            if (!remoteParticipant) {
                return state;
            }

            return updateParticipant(state, clientId, {
                isVideoEnabled,
            });
        },
        doParticipantMetadataChanged: (state, action: PayloadAction<ClientMetadataReceivedEvent>) => {
            const { clientId, displayName } = action.payload.payload;
            const remoteParticipant = state.remoteParticipants.find((p) => p.id === clientId);

            if (!remoteParticipant) {
                return state;
            }

            return updateParticipant(state, clientId, {
                displayName,
            });
        },
        doHandleClientLeft: (state, action: PayloadAction<ClientLeftEvent>) => {
            const { clientId } = action.payload;
            const remoteParticipants = state.remoteParticipants.filter((p) => p.id !== clientId);

            return {
                ...state,
                remoteParticipants,
            };
        },
    },
    extraReducers: (builder) => {
        builder.addCase(signalEvents.roomJoined, (state, action) => {
            if (!action.payload?.room) return state;
            const selfId = action.payload.selfId;
            const { clients } = action.payload.room;

            return {
                ...state,
                remoteParticipants: clients
                    .filter((c) => c.id !== selfId)
                    .filter((c) => !NON_PERSON_ROLES.includes(c.role.roleName))
                    .map((c) => ({
                        id: c.id,
                        displayName: c.displayName,
                        isAudioEnabled: c.isAudioEnabled,
                        isVideoEnabled: c.isVideoEnabled,
                        isLocalParticipant: false,
                        stream: null,
                        streams: c.streams.map((streamId) => ({ id: streamId, state: "new_accept" })),
                        newJoiner: false,
                    })),
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
    streamStatusUpdated,
} = remoteParticipantsSlice.actions;

export const selectRemoteParticipantsRaw = (state: RootState) => state.remoteParticipants;
export const selectRemoteParticipants = (state: RootState) => state.remoteParticipants.remoteParticipants;
//export const selectWaitingParticipants = (state: RootState) => state.room.waitingParticipants;
//export const selectScreenshares = (state: RootState) => state.room.screenshares;
