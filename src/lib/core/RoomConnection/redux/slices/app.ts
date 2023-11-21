import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import LocalMedia from "~/lib/LocalMedia";

export interface AppState {
    wantsToJoin: boolean;
    roomName: string | null;
    roomKey: string | null;
    displayName: string | null;
    sdkVersion: string | null;
    localMedia: LocalMedia | null;
}

const initialState: AppState = {
    wantsToJoin: false,
    roomName: null,
    roomKey: null,
    displayName: null,
    sdkVersion: null,
    localMedia: null,
};

export const appSlice = createSlice({
    name: "app",
    initialState,
    reducers: {
        doAppJoin: (
            state,
            action: PayloadAction<{
                roomName: string;
                roomKey: string | null;
                displayName: string;
                sdkVersion: string;
                localMedia?: LocalMedia;
            }>
        ) => {
            return {
                ...state,
                ...action.payload,
                wantsToJoin: true,
            };
        },
        doAppSetRoomKey: (state, action: PayloadAction<string>) => {
            return {
                ...state,
                roomKey: action.payload,
            };
        },
    },
});

export const { doAppJoin, doAppSetRoomKey } = appSlice.actions;

export const selectAppRaw = (state: RootState) => state.app;
export const selectAppWantsToJoin = (state: RootState) => state.app.wantsToJoin;
export const selectAppRoomName = (state: RootState) => state.app.roomName;
export const selectAppRoomKey = (state: RootState) => state.app.roomKey;
export const selectAppDisplayName = (state: RootState) => state.app.displayName;
export const selectAppSdkVersion = (state: RootState) => state.app.sdkVersion;
export const selectAppLocalMedia = (state: RootState) => state.app.localMedia;
