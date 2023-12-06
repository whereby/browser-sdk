import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { createAppThunk } from "../thunk";
import { signalEvents } from "./signalConnection/actions";
import { selectSignalConnectionRaw } from "./signalConnection";

/**
 * Reducer
 */
export interface CloudRecordingState {
    isRecording: boolean;
    error: unknown;
    status?: "recording" | "requested" | "error";
    startedAt?: number;
}

export const initialState: CloudRecordingState = {
    isRecording: false,
    error: null,
    startedAt: undefined,
};

export const cloudRecordingSlice = createSlice({
    name: "cloudRecording",
    initialState,
    reducers: {
        recordingStarted: (state) => {
            return {
                ...state,
                isRecording: true,
            };
        },
        recordingStopped: (state) => {
            return {
                ...state,
                isRecording: false,
            };
        },
    },
    extraReducers: (builder) => {
        builder.addCase(signalEvents.cloudRecordingStopped, (state) => {
            return {
                ...state,
                isRecording: false,
            };
        });
        builder.addCase(signalEvents.cloudRecordingStarted, (state, action) => {
            const { payload } = action;

            if (!payload.error) {
                return state;
            }

            return {
                ...state,
                isRecording: false,
                status: "error",
                error: payload.error,
            };
        });

        builder.addCase(signalEvents.newClient, (state, { payload }) => {
            const { client } = payload;
            if (client.role?.roleName === "recorder") {
                return {
                    ...state,
                    isRecording: true,
                    status: "recording",
                    startedAt: client.startedCloudRecordingAt
                        ? new Date(client.startedCloudRecordingAt).getTime()
                        : new Date().getTime(),
                };
            }
            return state;
        });
    },
});

/**
 * Action creators
 */
export const { recordingStarted, recordingStopped } = cloudRecordingSlice.actions;

export const doStartCloudRecording = createAppThunk(() => (dispatch, getState) => {
    const state = getState();
    const socket = selectSignalConnectionRaw(state).socket;

    socket?.emit("start_recording", {
        recording: "cloud",
    });

    dispatch(recordingStarted());
});

export const doStopCloudRecording = createAppThunk(() => (dispatch, getState) => {
    const state = getState();
    const socket = selectSignalConnectionRaw(state).socket;

    socket?.emit("stop_recording");

    dispatch(recordingStopped());
});

/**
 * Selectors
 */
export const selectCloudRecordingRaw = (state: RootState) => state.cloudRecording;
