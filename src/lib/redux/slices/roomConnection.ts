import { createSlice } from "@reduxjs/toolkit";

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
    reducers: {},
});

export const selectRoomConnectionRaw = (state: RootState) => state.roomConnection;
