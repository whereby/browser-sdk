import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ChatMessage as SignalChatMessage } from "@whereby/jslib-media/src/utils/ServerSocket";
import { RootState } from "../store";

export type ChatMessage = Pick<SignalChatMessage, "senderId" | "timestamp" | "text">;

export interface ChatState {
    chatMessages: ChatMessage[];
}

const initialState: ChatState = {
    chatMessages: [],
};

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
