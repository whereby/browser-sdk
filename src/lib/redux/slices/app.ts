import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface AppState {
    wantsToJoin: boolean;
    roomName: string | null;
    roomKey: string | null;
    displayName: string | null;
    sdkVersion: string | null;
}

const initialState: AppState = {
    wantsToJoin: false,
    roomName: null,
    roomKey: null,
    displayName: null,
    sdkVersion: null,
};

export const appSlice = createSlice({
    name: "app",
    initialState,
    reducers: {
        doAppJoin: (
            state,
            action: PayloadAction<{ roomName: string; roomKey: string | null; displayName: string; sdkVersion: string }>
        ) => {
            return {
                ...state,
                ...action.payload,
                wantsToJoin: true,
            };
        },
    },
});

export const { doAppJoin } = appSlice.actions;

export const selectAppRaw = (state: RootState) => state.app;
export const selectAppWantsToJoin = (state: RootState) => state.app.wantsToJoin;
export const selectAppRoomName = (state: RootState) => state.app.roomName;
export const selectAppRoomKey = (state: RootState) => state.app.roomKey;
export const selectAppDisplayName = (state: RootState) => state.app.displayName;
export const selectAppSdkVersion = (state: RootState) => state.app.sdkVersion;
