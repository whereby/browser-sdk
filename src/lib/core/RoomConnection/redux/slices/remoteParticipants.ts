import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import {
    AudioEnabledEvent,
    ClientMetadataReceivedEvent,
    SignalClient,
    VideoEnabledEvent,
} from "@whereby/jslib-media/src/utils/ServerSocket";
import { RemoteParticipant, StreamState } from "~/lib/RoomParticipant";
import { StreamStatusUpdate } from "./rtcConnection";
import { signalEvents } from "./signalConnection";
import { RtcStreamAddedPayload } from "@whereby/jslib-media/src/webrtc/RtcManagerDispatcher";

const NON_PERSON_ROLES = ["recorder", "streamer"];

export interface RemoteParticipantState {
    remoteParticipants: RemoteParticipant[];
}

const initialState: RemoteParticipantState = {
    remoteParticipants: [],
};

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

function addParticipant(state: RemoteParticipantState, participant: SignalClient) {
    const { participant: foundParticipant } = findParticipant(state, participant.id);

    if (foundParticipant) {
        console.warn(`Client already existing ${participant.id}. Ignoring`);
        return state;
    }

    const remoteParticipant: RemoteParticipant = {
        id: participant.id,
        displayName: participant.displayName,
        isAudioEnabled: participant.isAudioEnabled,
        isVideoEnabled: participant.isVideoEnabled,
        isLocalParticipant: false,
        stream: null,
        streams: participant.streams.map((streamId) => ({ id: streamId, state: "new_accept" })),
        newJoiner: true,
    };

    return {
        ...state,
        remoteParticipants: [...state.remoteParticipants, remoteParticipant],
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

function removeClient(state: RemoteParticipantState, participantId: string) {
    return {
        ...state,
        remoteParticipants: state.remoteParticipants.filter((c) => c.id !== participantId),
    };
}

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
        participantStreamAdded: (state, action: PayloadAction<RtcStreamAddedPayload>) => {
            const { clientId, stream } = action.payload;
            const remoteParticipant = state.remoteParticipants.find((p) => p.id === clientId);

            if (!remoteParticipant) {
                return state;
            }

            return updateParticipant(state, clientId, {
                stream,
            });
        },
        participantAudioEnabled: (state, action: PayloadAction<AudioEnabledEvent>) => {
            const { clientId, isAudioEnabled } = action.payload;
            const remoteParticipant = state.remoteParticipants.find((p) => p.id === clientId);

            if (!remoteParticipant) {
                return state;
            }

            return updateParticipant(state, clientId, {
                isAudioEnabled,
            });
        },
        participantVideoEnabled: (state, action: PayloadAction<VideoEnabledEvent>) => {
            const { clientId, isVideoEnabled } = action.payload;
            const remoteParticipant = state.remoteParticipants.find((p) => p.id === clientId);

            if (!remoteParticipant) {
                return state;
            }

            return updateParticipant(state, clientId, {
                isVideoEnabled,
            });
        },
        participantMetadataChanged: (state, action: PayloadAction<ClientMetadataReceivedEvent>) => {
            const { clientId, displayName } = action.payload.payload;
            const remoteParticipant = state.remoteParticipants.find((p) => p.id === clientId);

            if (!remoteParticipant) {
                return state;
            }

            return updateParticipant(state, clientId, {
                displayName,
            });
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
        builder.addCase(signalEvents.newClient, (state, action) => {
            const { client } = action.payload;

            if (NON_PERSON_ROLES.includes(client.role.roleName)) {
                return state;
            }

            return addParticipant(state, client);
        });
        builder.addCase(signalEvents.clientLeft, (state, action) => {
            const { clientId } = action.payload;

            return removeClient(state, clientId);
        });
    },
});

export const {
    participantStreamAdded,
    participantAudioEnabled,
    participantVideoEnabled,
    participantMetadataChanged,
    streamStatusUpdated,
} = remoteParticipantsSlice.actions;

export const selectRemoteParticipantsRaw = (state: RootState) => state.remoteParticipants;
export const selectRemoteParticipants = (state: RootState) => state.remoteParticipants.remoteParticipants;
