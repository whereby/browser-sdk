import { createSlice, createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { createAppThunk } from "../asyncThunk";
import LocalMedia from "~/lib/LocalMedia";
import { doAppJoin, selectAppRoomKey } from "./app";
import { createReactor } from "../listenerMiddleware";

/**
 * State & reducer
 */

export interface LocalMediaState {
    isStarting: boolean;
    hasStarted: boolean;
    localMediaInstance?: LocalMedia;
}

const initialState: LocalMediaState = {
    isStarting: false,
    hasStarted: false,
    localMediaInstance: undefined,
};

export const localMediaSlice = createSlice({
    name: "localMedia",
    initialState,
    reducers: {
        starting: (state) => {
            return {
                ...state,
                hasStarted: false,
                isStarting: true,
            };
        },
        started: (state) => {
            return {
                ...state,
                hasStarted: true,
                isStarting: false,
            };
        },
    },
    extraReducers(builder) {
        builder.addCase(doAppJoin, (state, action) => {
            return {
                ...state,
                localMediaInstance: action.payload.localMedia,
            };
        });
    },
});

/**
 * Action creators
 */

export const { started, starting } = localMediaSlice.actions;

export const doLocalMediaStart = createAppThunk(() => async (dispatch, getState) => {
    const { localMediaInstance } = selectLocalMediaRaw(getState());
    if (!localMediaInstance) {
        return;
    }

    dispatch(starting());
    await localMediaInstance.start();
    dispatch(started());
});

/**
 * Selectors
 */

export const selectLocalMediaRaw = (state: RootState) => state.localMedia;
export const selectLocalMediaInstance = (state: RootState) => state.localMedia.localMediaInstance;
export const selectLocalMediaStream = (state: RootState) => state.localMedia.localMediaInstance?.stream;
export const selectLocalMediaStarted = (state: RootState) => state.localMedia.hasStarted;

/**
 * Reactors
 */

export const selectLocalMediaShouldStart = createSelector(selectLocalMediaRaw, (raw) => {
    const { hasStarted, isStarting, localMediaInstance } = raw;
    return !!localMediaInstance && !hasStarted && !isStarting;
});

createReactor([selectLocalMediaShouldStart], ({ dispatch }, localMediaShouldStart) => {
    if (localMediaShouldStart) {
        dispatch(doLocalMediaStart());
    }
});
