import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import type { LocalMediaOptions } from "./localMedia";

/**
 * Reducer
 */
export interface AppState {
    wantsToJoin: boolean;
    roomUrl: string | null;
    roomName: string | null;
    roomKey: string | null;
    displayName: string | null;
    sdkVersion: string | null;
    externalId: string | null;
}

const initialState: AppState = {
    wantsToJoin: false,
    roomName: null,
    roomKey: null,
    roomUrl: null,
    displayName: null,
    sdkVersion: null,
    externalId: null,
};

export const appSlice = createSlice({
    name: "app",
    initialState,
    reducers: {
        doAppJoin: (
            state,
            action: PayloadAction<{
                displayName: string;
                localMediaOptions?: LocalMediaOptions;
                roomKey: string | null;
                roomUrl: string;
                sdkVersion: string;
                externalId: string | null;
            }>
        ) => {
            const url = new URL(action.payload.roomUrl);

            return {
                ...state,
                ...action.payload,
                roomName: url.pathname,
                wantsToJoin: true,
            };
        },
        appLeft: (state) => {
            return { ...state, wantsToJoin: false };
        },
        setRoomKey: (state, action: PayloadAction<string>) => {
            return {
                ...state,
                roomKey: action.payload,
            };
        },
    },
});

/**
 * Action creators
 */
export const { doAppJoin, appLeft, setRoomKey } = appSlice.actions;

/**
 * Selectors
 */
export const selectAppRaw = (state: RootState) => state.app;
export const selectAppWantsToJoin = (state: RootState) => state.app.wantsToJoin;
export const selectAppRoomName = (state: RootState) => state.app.roomName;
export const selectAppRoomUrl = (state: RootState) => state.app.roomUrl;
export const selectAppRoomKey = (state: RootState) => state.app.roomKey;
export const selectAppDisplayName = (state: RootState) => state.app.displayName;
export const selectAppSdkVersion = (state: RootState) => state.app.sdkVersion;
export const selectAppExternalId = (state: RootState) => state.app.externalId;
