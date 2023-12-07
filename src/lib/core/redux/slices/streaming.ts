import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";

/**
 * Reducer
 */

export interface StreamingState {
    isStreaming: boolean;
    error: unknown;
    startedAt?: number;
}

const initialState: StreamingState = {
    isStreaming: false,
    error: null,
    startedAt: undefined,
};

export const streamingSlice = createSlice({
    name: "streaming",
    initialState,
    reducers: {
        doHandleStreamingStarted: (state) => {
            return {
                ...state,
                isStreaming: true,
                error: null,
                // We don't have the streaming start time stored on the
                // server, so we use the current time instead. This gives
                // an invalid timestamp for "Client B" if "Client A" has
                // been streaming for a while before "Client B" joins.
                startedAt: new Date().getTime(),
            };
        },
        doHandleStreamingStopped: (state) => {
            return {
                ...state,
                isStreaming: false,
            };
        },
    },
});

/**
 * Action creators
 */

export const { doHandleStreamingStarted, doHandleStreamingStopped } = streamingSlice.actions;

/**
 * Selectors
 */

export const selectStreamingRaw = (state: RootState) => state.streaming;
