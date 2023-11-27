import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { SignalClient } from "@whereby/jslib-media/src/utils/ServerSocket";
import { RemoteParticipant, StreamState } from "~/lib/RoomParticipant";
import { StreamStatusUpdate, rtcEvents } from "./rtcConnection";
import { signalEvents } from "./signalConnection";
import { RtcStreamAddedPayload } from "@whereby/jslib-media/src/webrtc/RtcManagerDispatcher";

const NON_PERSON_ROLES = ["recorder", "streamer"];

export interface RemoteParticipantState {
    remoteParticipants: RemoteParticipant[];
}

const initialState: RemoteParticipantState = {
    remoteParticipants: [],
};

function createParticipant(client: SignalClient, newJoiner = false): RemoteParticipant {
    const { streams, ...rest } = client;

    return {
        ...rest,
        stream: null,
        streams: streams.map((streamId) => ({ id: streamId, state: newJoiner ? "new_accept" : "to_accept" })),
        isLocalParticipant: false,
        presentationStream: null,
        newJoiner,
    };
}

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

function addParticipant(state: RemoteParticipantState, participant: RemoteParticipant) {
    const { participant: foundParticipant } = findParticipant(state, participant.id);

    if (foundParticipant) {
        console.warn(`Client already existing ${participant.id}. Ignoring`);
        return state;
    }

    return {
        ...state,
        remoteParticipants: [...state.remoteParticipants, participant],
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

function addStreamId(state: RemoteParticipantState, participantId: string, streamId: string) {
    const { participant } = findParticipant(state, participantId);
    if (!participant || participant.streams.find((s) => s.id === streamId)) {
        console.warn(`No participant ${participantId} or stream ${streamId} already exists`);
        return state;
    }

    return updateParticipant(state, participantId, {
        streams: [...participant.streams, { id: streamId, state: "to_accept" }],
    });
}

function removeStreamId(state: RemoteParticipantState, participantId: string, streamId: string) {
    const { participant } = findParticipant(state, participantId);
    if (!participant) {
        console.error(`No participant ${participantId} found to remove stream ${streamId}`);
        return state;
    }
    const currentStreamId = participant.stream && participant.stream.id;
    const presentationId = participant.presentationStream?.inboundId || participant.presentationStream?.id;
    const idIdx = participant.streams.findIndex((s) => s.id === streamId);

    return updateParticipant(state, participantId, {
        streams: participant.streams.filter((_, i) => i !== idIdx),
        ...(currentStreamId === streamId && { stream: null }),
        ...(presentationId === streamId && { presentationStream: null }),
    });
}

function addStream(state: RemoteParticipantState, payload: RtcStreamAddedPayload) {
    const { clientId, stream, streamType } = payload;
    let { streamId } = payload;

    const { participant } = findParticipant(state, clientId);

    if (!participant) {
        console.error(`Did not find client ${clientId} for adding stream`);
        return state;
    }

    const remoteParticipants = state.remoteParticipants;

    if (!streamId) {
        streamId = stream.id;
    }

    const remoteParticipant = remoteParticipants.find((p) => p.id === clientId);

    if (!remoteParticipant) {
        return state;
    }

    const remoteParticipantStream =
        remoteParticipant.streams.find((s) => s.id === streamId) || remoteParticipant.streams[0];

    if (
        (remoteParticipant.stream && remoteParticipant.stream.id === streamId) ||
        (!remoteParticipant.stream && streamType === "webcam") ||
        (!remoteParticipant.stream && !streamType && remoteParticipant.streams.indexOf(remoteParticipantStream) < 1)
    ) {
        return updateParticipant(state, clientId, { stream });
    }
    // screen share
    return updateParticipant(state, clientId, {
        presentationStream: stream,
    });
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

            return updateParticipant(state, clientId, {
                stream,
            });
        },
        participantStreamIdAdded: (state, action: PayloadAction<{ clientId: string; streamId: string }>) => {
            const { clientId, streamId } = action.payload;

            return addStreamId(state, clientId, streamId);
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
                    .map((c) => createParticipant(c)),
            };
        });
        builder.addCase(rtcEvents.streamAdded, (state, action) => {
            return addStream(state, action.payload);
        });
        builder.addCase(signalEvents.newClient, (state, action) => {
            const { client } = action.payload;

            if (NON_PERSON_ROLES.includes(client.role.roleName)) {
                return state;
            }

            return addParticipant(state, createParticipant(client, true));
        });
        builder.addCase(signalEvents.clientLeft, (state, action) => {
            const { clientId } = action.payload;

            return removeClient(state, clientId);
        });
        builder.addCase(signalEvents.audioEnabled, (state, action) => {
            const { clientId, isAudioEnabled } = action.payload;

            return updateParticipant(state, clientId, {
                isAudioEnabled,
            });
        });
        builder.addCase(signalEvents.videoEnabled, (state, action) => {
            const { clientId, isVideoEnabled } = action.payload;

            return updateParticipant(state, clientId, {
                isVideoEnabled,
            });
        });
        builder.addCase(signalEvents.clientMetadataReceived, (state, action) => {
            const { clientId, displayName } = action.payload.payload;

            return updateParticipant(state, clientId, {
                displayName,
            });
        });
        builder.addCase(signalEvents.screenshareStarted, (state, action) => {
            const { clientId, streamId } = action.payload;

            return addStreamId(state, clientId, streamId);
        });
        builder.addCase(signalEvents.screenshareStopped, (state, action) => {
            const { clientId, streamId } = action.payload;

            return removeStreamId(state, clientId, streamId);
        });
    },
});

export const { participantStreamAdded, participantStreamIdAdded, streamStatusUpdated } =
    remoteParticipantsSlice.actions;

export const selectRemoteParticipantsRaw = (state: RootState) => state.remoteParticipants;
export const selectRemoteParticipants = (state: RootState) => state.remoteParticipants.remoteParticipants;
