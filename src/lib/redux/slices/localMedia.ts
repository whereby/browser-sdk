import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import LocalMedia from "~/lib/LocalMedia";

export interface LocalMediaState {
    localMedia: LocalMedia | null;
}

const initialState: LocalMediaState = {
    localMedia: null,
};

export const localMediaSlice = createSlice({
    name: "localMedia",
    initialState,
    reducers: {},
});

// export const { doAppJoin } = appSlice.actions;

export const selectLocalMediaRaw = (state: RootState) => state.localMedia;
