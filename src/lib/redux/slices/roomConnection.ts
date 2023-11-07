import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import { ConnectionStatus } from "~/lib/RoomConnection";
import { RootState } from "../store";

export interface RoomConnectionState {
    status: ConnectionStatus;
    error: unknown;
}

const initialState: RoomConnectionState = {
    status: "initializing",
    error: null,
};

export const roomConnectionSlice = createSlice({
    initialState,
    name: "roomConnection",
    reducers: {
        doRoomConnectionStatusChanged: (state, action: PayloadAction<{ status: ConnectionStatus }>) => {
            return {
                ...state,
                status: action.payload.status,
            };
        },
    },
});

export const { doRoomConnectionStatusChanged } = roomConnectionSlice.actions;

export const selectRoomConnectionRaw = (state: RootState) => state.roomConnection;
export const selectRoomConnectionStatus = (state: RootState) => state.roomConnection.status;
