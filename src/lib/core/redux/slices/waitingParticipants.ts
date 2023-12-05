import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { WaitingParticipant } from "../../../../lib/RoomParticipant";
import { createAppThunk } from "../thunk";
import { signalEvents } from "./signalConnection/actions";
import { selectSignalConnectionSocket } from "./signalConnection";

/**
 * Reducer
 */
export interface WaitingParticipantsState {
    waitingParticipants: WaitingParticipant[];
}

const initialState: WaitingParticipantsState = {
    waitingParticipants: [],
};

export const waitingParticipantsSlice = createSlice({
    name: "waitingParticipants",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(signalEvents.roomJoined, (state, { payload }) => {
            if (payload.room?.knockers.length) {
                return {
                    ...state,
                    waitingParticipants: payload.room.knockers.map((knocker) => ({
                        id: knocker.clientId,
                        displayName: knocker.displayName,
                    })),
                };
            } else {
                return state;
            }
        });

        builder.addCase(signalEvents.roomKnocked, (state, action) => {
            const { clientId, displayName } = action.payload;
            return {
                ...state,
                waitingParticipants: [...state.waitingParticipants, { id: clientId, displayName }],
            };
        });
        builder.addCase(signalEvents.knockerLeft, (state, action) => {
            const { clientId } = action.payload;
            return {
                ...state,
                waitingParticipants: state.waitingParticipants.filter((p) => p.id !== clientId),
            };
        });
    },
});

/**
 * Action creators
 */

export const doAcceptWaitingParticipant = createAppThunk(
    (payload: { participantId: string }) => (dispatch, getState) => {
        const { participantId } = payload;
        const state = getState();
        const socket = selectSignalConnectionSocket(state);

        socket?.emit("handle_knock", {
            action: "accept",
            clientId: participantId,
            response: {},
        });
    }
);

export const doRejectWaitingParticipant = createAppThunk(
    (payload: { participantId: string }) => (dispatch, getState) => {
        const { participantId } = payload;
        const state = getState();
        const socket = selectSignalConnectionSocket(state);

        socket?.emit("handle_knock", {
            action: "reject",
            clientId: participantId,
            response: {},
        });
    }
);

/**
 * Selectors
 */

export const selectWaitingParticipantsRaw = (state: RootState) => state.waitingParticipants;
export const selectWaitingParticipants = (state: RootState) => state.waitingParticipants.waitingParticipants;
