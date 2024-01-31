import { PayloadAction, createSelector, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { SignalClient } from "@whereby/jslib-media/src/utils/ServerSocket";
import { RemoteParticipant, Screenshare, StreamState } from "../../../../lib/core/RoomParticipant";
import { rtcEvents } from "./rtcConnection/actions";
import { StreamStatusUpdate } from "./rtcConnection/types";
import { signalEvents } from "./signalConnection/actions";
import { RtcStreamAddedPayload } from "@whereby/jslib-media/src/webrtc/RtcManagerDispatcher";
import { selectLocalScreenshareStream } from "./localScreenshare";

const NON_PERSON_ROLES = ["recorder", "streamer"];

/**
 * State mapping utils
 */

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

    const idIdx = participant.streams.findIndex((s) => s.id === streamId);
    const streams = [...participant.streams];
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

    const remoteParticipantStream = remoteParticipant.streams.find((s) => s.id === streamId);

    if (
        (remoteParticipant.stream &&
            (remoteParticipant.stream.id === streamId || remoteParticipant.stream.inboundId === streamId)) ||
        (!remoteParticipant.stream && streamType === "webcam") ||
        (!remoteParticipant.stream && !streamType && !remoteParticipantStream)
    ) {
        return updateParticipant(state, clientId, { stream });
    }
    // screen share
    return updateParticipant(state, clientId, {
        presentationStream: stream,
    });
}

/**
 * Reducer
 */

export interface RemoteParticipantState {
    remoteParticipants: RemoteParticipant[];
}

const initialState: RemoteParticipantState = {
    remoteParticipants: [],
};

export const remoteParticipantsSlice = createSlice({
    name: "remoteParticipants",
    initialState,
    reducers: {
        streamStatusUpdated: (state, action: PayloadAction<StreamStatusUpdate[]>) => {
            let newState = state;

            for (const { clientId, streamId, state } of action.payload) {
                newState = updateStreamState(newState, clientId, streamId, state);
            }

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

/**
 * Action creators
 */

export const { participantStreamAdded, participantStreamIdAdded, streamStatusUpdated } =
    remoteParticipantsSlice.actions;

/**
 * Selectors
 */

export const selectRemoteParticipantsRaw = (state: RootState) => state.remoteParticipants;
export const selectRemoteParticipants = (state: RootState) => state.remoteParticipants.remoteParticipants;

export const selectScreenshares = createSelector(
    selectLocalScreenshareStream,
    selectRemoteParticipants,
    (localScreenshareStream, remoteParticipants) => {
        const screenshares: Screenshare[] = [];

        if (localScreenshareStream) {
            screenshares.push({
                id: localScreenshareStream.id,
                participantId: "local",
                hasAudioTrack: localScreenshareStream.getAudioTracks().length > 0,
                stream: localScreenshareStream,
                isLocal: true,
            });
        }

        for (const participant of remoteParticipants) {
            if (participant.presentationStream) {
                screenshares.push({
                    id: participant.presentationStream.id,
                    participantId: participant.id,
                    hasAudioTrack: participant.presentationStream.getAudioTracks().length > 0,
                    stream: participant.presentationStream,
                    isLocal: false,
                });
            }
        }

        return screenshares;
    }
);
