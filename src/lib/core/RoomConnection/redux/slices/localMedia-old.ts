import { createSlice, createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../../redux/store";
import { createAppThunk } from "../../../redux/asyncThunk";
import LocalMedia from "~/lib/LocalMedia";
import { doAppJoin } from "./app";
import { createReactor } from "../../../redux/listenerMiddleware";

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
    name: "localMedia-old",
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
    //const { localMediaInstance } = selectLocalMediaRaw(getState());
    /*if (!localMediaInstance) {
        return;
    }

    dispatch(starting());
    await localMediaInstance.start();*/
    dispatch(started());
});

/**
 * Selectors
 */

export const selectLocalMediaRaw = (state: RootState) => state.localMedia;
export const selectLocalMediaInstance = () => undefined;
export const selectLocalMediaStream = () => undefined;
export const selectLocalMediaStarted = () => false;

/**
 * Reactors
 */

export const selectLocalMediaShouldStart = createSelector(selectLocalMediaRaw, (raw) => {
    //const { hasStarted, isStarting, localMediaInstance } = raw;
    //return !!localMediaInstance && !hasStarted && !isStarting;
    return false;
});

createReactor([selectLocalMediaShouldStart], ({ dispatch }, localMediaShouldStart) => {
    if (localMediaShouldStart) {
        dispatch(doLocalMediaStart());
    }
});
