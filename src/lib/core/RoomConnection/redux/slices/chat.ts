import { createSlice } from "@reduxjs/toolkit";
import { ChatMessage as SignalChatMessage } from "@whereby/jslib-media/src/utils/ServerSocket";
import { RootState } from "../../../redux/store";
import { createAppThunk } from "../../../redux/asyncThunk";
import { selectSignalConnectionRaw, signalEvents } from "./signalConnection";

export type ChatMessage = Pick<SignalChatMessage, "senderId" | "timestamp" | "text">;

/**
 * Reducer
 */
export interface ChatState {
    chatMessages: ChatMessage[];
}

const initialState: ChatState = {
    chatMessages: [],
};

export const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {},
    extraReducers(builder) {
        builder.addCase(signalEvents.chatMessage, (state, action) => {
            return {
                ...state,
                chatMessages: [...state.chatMessages, action.payload],
            };
        });
    },
});

/**
 * Action creators
 */
export const doSendChatMessage = createAppThunk((payload: { text: string }) => (_, getState) => {
    const state = getState();
    const socket = selectSignalConnectionRaw(state).socket;

    socket?.emit("chat_message", { text: payload.text });
});

/**
 * Selectors
 */
export const selectChatRaw = (state: RootState) => state.chat;
export const selectChatMessages = (state: RootState) => state.chat.chatMessages;
