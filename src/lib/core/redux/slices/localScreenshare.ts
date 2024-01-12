import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createAppAsyncThunk, createAppThunk } from "../thunk";
import { RootState } from "../store";
import { startAppListening } from "../listenerMiddleware";
import { localMediaStopped } from "./localMedia";

export interface LocalScreenshareState {
    status: "" | "starting" | "active";
    stream: MediaStream | null;
    error: unknown | null;
}

const initialState: LocalScreenshareState = {
    status: "",
    stream: null,
    error: null,
};

/**
 * Reducer
 */

export const localScreenshareSlice = createSlice({
    name: "localScreenshare",
    initialState,
    reducers: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        stopScreenshare(state, action: PayloadAction<{ stream: MediaStream }>) {
            return {
                ...state,
                status: "",
                stream: null,
            };
        },
    },
    extraReducers: (builder) => {
        builder.addCase(doStartScreenshare.pending, (state) => {
            return {
                ...state,
                status: "starting",
            };
        });
        builder.addCase(doStartScreenshare.fulfilled, (state, { payload: { stream } }) => {
            return {
                ...state,
                status: "active",
                stream,
            };
        });
        builder.addCase(doStartScreenshare.rejected, (state, { payload }) => {
            return {
                ...state,
                error: payload,
                status: "",
                stream: null,
            };
        });
    },
});

/**
 * Action creators
 */

export const { stopScreenshare } = localScreenshareSlice.actions;

export const doStartScreenshare = createAppAsyncThunk(
    "localScreenshare/doStartScreenshare",
    async (_, { dispatch, getState, rejectWithValue }) => {
        try {
            const state = getState();
            const screenshareStream = selectLocalScreenshareStream(state);

            if (screenshareStream) {
                return { stream: screenshareStream };
            }

            const stream = await navigator.mediaDevices.getDisplayMedia();

            const onEnded = () => {
                dispatch(doStopScreenshare());
            };

            if ("oninactive" in stream) {
                // Chrome
                stream.addEventListener("inactive", onEnded);
            } else {
                // Firefox
                stream.getVideoTracks()[0]?.addEventListener("ended", onEnded);
            }

            return { stream };
        } catch (error) {
            return rejectWithValue(error);
        }
    }
);

export const doStopScreenshare = createAppThunk(() => (dispatch, getState) => {
    const state = getState();
    const screenshareStream = selectLocalScreenshareStream(state);

    if (!screenshareStream) {
        return;
    }

    screenshareStream.getTracks().forEach((track) => track.stop());
    dispatch(stopScreenshare({ stream: screenshareStream }));
});

/**
 * Selectors
 */

export const selectLocalScreenshareRaw = (state: RootState) => state.localScreenshare;
export const selectLocalScreenshareStatus = (state: RootState) => state.localScreenshare.status;
export const selectLocalScreenshareStream = (state: RootState) => state.localScreenshare.stream;

/**
 * Reactors
 */

startAppListening({
    actionCreator: localMediaStopped,
    effect: (_, { getState }) => {
        const state = getState();
        const screenshareStream = selectLocalScreenshareStream(state);

        if (!screenshareStream) {
            return;
        }

        screenshareStream?.getTracks().forEach((track) => {
            track.stop();
        });
    },
});
