import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ChatMessage as SignalChatMessage } from "@whereby/jslib-media/src/utils/ServerSocket";
import { RootState } from "../store";
import { createAppAsyncThunk } from "../asyncThunk";
import { selectSignalConnectionRaw } from "./signalConnection";

export type ChatMessage = Pick<SignalChatMessage, "senderId" | "timestamp" | "text">;

export interface ChatState {
    chatMessages: ChatMessage[];
}

const initialState: ChatState = {
    chatMessages: [],
};

export const doSendChatMessage = createAppAsyncThunk(
    "chat/doSendChatMessage",
    async (payload: { text: string }, { getState }) => {
        const state = getState();
        const socket = selectSignalConnectionRaw(state).socket;

        socket?.emit("chat_message", { text: payload.text });
    }
);

export const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        doChatMessageReceived: (state, action: PayloadAction<ChatMessage>) => {
            return {
                ...state,
                chatMessages: [...state.chatMessages, action.payload],
            };
        },
    },
});

export const { doChatMessageReceived } = chatSlice.actions;

export const selectChatRaw = (state: RootState) => state.chat;
export const selectChatMessages = (state: RootState) => state.chat.chatMessages;
