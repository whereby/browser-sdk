import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface AppState {
    wantsToJoin: boolean;
}

const initialState: AppState = {
    wantsToJoin: false,
};

export const appSlice = createSlice({
    name: "app",
    initialState,
    reducers: {
        doAppJoin: (state) => {
            return {
                ...state,
                wantsToJoin: true,
            };
        },
    },
});

export const { doAppJoin } = appSlice.actions;

export const selectAppRaw = (state: RootState) => state.app;
export const selectAppWantsToJoin = (state: RootState) => state.app.wantsToJoin;
