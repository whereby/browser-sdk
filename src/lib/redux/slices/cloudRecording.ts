import { createSlice } from "@reduxjs/toolkit";
import { RootState, createAppAsyncThunk } from "../store";
import { selectSignalConnectionRaw } from "./signalConnection";
import { CloudRecordingStartedEvent } from "@whereby/jslib-media/src/utils/ServerSocket";

export interface CloudRecordingState {
    isRecording: boolean;
    error: unknown;
}

const initialState: CloudRecordingState = {
    isRecording: false,
    error: null,
};

export const doStartCloudRecording = createAppAsyncThunk(
    "cloudRecording/doStartCloudRecording",
    async (_, { getState }) => {
        const state = getState();
        const socket = selectSignalConnectionRaw(state).socket;

        socket?.emit("start_recording", {
            recording: "cloud",
        });

        return true;
    }
);

export const doStopCloudRecording = createAppAsyncThunk(
    "cloudRecording/doStopCloudRecording",
    async (_, { getState }) => {
        const state = getState();
        const socket = selectSignalConnectionRaw(state).socket;

        socket?.emit("stop_recording");

        return true;
    }
);

export const doHandleCloudRecordingStarted = createAppAsyncThunk(
    "cloudRecording/doHandleCloudRecordingStarted",
    async (payload: CloudRecordingStartedEvent) => {
        // Only handle the start failure event here. The recording is
        // considered started when the recorder client joins.
        if (payload.error) {
            return { error: payload.error };
        }
        return null;
    }
);

export const cloudRecordingSlice = createSlice({
    name: "cloudRecording",
    initialState,
    reducers: {
        doHandleRecorderClientJoined: (state) => {
            return {
                ...state,
                isRecording: true,
            };
        },
        doHandleCloudRecordingStopped: (state) => {
            return {
                ...state,
                isRecording: false,
            };
        },
    },
    extraReducers: (builder) => {
        builder.addCase(doStartCloudRecording.fulfilled, (state) => {
            return {
                ...state,
                isRecording: true,
            };
        });
        builder.addCase(doStopCloudRecording.fulfilled, (state) => {
            return {
                ...state,
                isRecording: false,
            };
        });
        builder.addCase(doHandleCloudRecordingStarted.fulfilled, (state, action) => {
            if (!action.payload) {
                return state;
            }
            return {
                ...state,
                isRecording: false,
                error: action.payload.error,
            };
        });
    },
});

export const { doHandleRecorderClientJoined, doHandleCloudRecordingStopped } = cloudRecordingSlice.actions;

export const selectCloudRecordingRaw = (state: RootState) => state.cloudRecording;
