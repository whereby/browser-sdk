import { createSlice } from "@reduxjs/toolkit";
import { RootState, createAppAsyncThunk } from "../store";
import { selectSignalConnectionRaw } from "./signalConnection";
import { CloudRecordingStartedEvent, SignalClient } from "@whereby/jslib-media/src/utils/ServerSocket";

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

export const doHandleRecorderClientJoined = createAppAsyncThunk(
    "cloudRecording/doHandleCloudRecordingClientJoined",
    async (payload: { client: SignalClient }) => {
        const { client } = payload;

        return {
            startedAt: client.startedCloudRecordingAt
                ? new Date(client.startedCloudRecordingAt).getTime()
                : new Date().getTime(),
        };
    }
);

export const cloudRecordingSlice = createSlice({
    name: "cloudRecording",
    initialState,
    reducers: {
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
        builder.addCase(doHandleRecorderClientJoined.fulfilled, (state, action) => {
            if (!action.payload) {
                return state;
            }
            return {
                ...state,
                isRecording: true,
                error: null,
                startedAt: action.payload.startedAt,
            };
        });
    },
});

export const { doHandleCloudRecordingStopped } = cloudRecordingSlice.actions;

export const selectCloudRecordingRaw = (state: RootState) => state.cloudRecording;
