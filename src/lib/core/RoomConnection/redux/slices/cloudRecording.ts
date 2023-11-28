import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../../../redux/store";
import { createAppThunk } from "../../../redux/asyncThunk";
import { selectSignalConnectionRaw, signalEvents } from "./signalConnection";

/**
 * Reducer
 */
export interface CloudRecordingState {
    isRecording: boolean;
    error: unknown;
    startedAt?: number;
}

const initialState: CloudRecordingState = {
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
                error: payload.error,
            };
        });

        builder.addCase(signalEvents.newClient, (state, { payload }) => {
            const { client } = payload;
            if (client.role?.roleName === "recorder") {
                return {
                    ...state,
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
