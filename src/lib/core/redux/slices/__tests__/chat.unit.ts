import { chatSlice } from "../chat";
import { signalEvents } from "../signalConnection/actions";

describe("chatSlice", () => {
    describe("reducers", () => {
        it("signalEvents.chatMessage", () => {
            const state = chatSlice.reducer(
                undefined,
                signalEvents.chatMessage({
                    id: "messageId",
                    userId: "userId",
                    senderId: "senderId",
                    messageType: "text",
                    roomName: "roomName",
                    sig: "sig",
                    timestamp: "123",
                    text: "text",
                })
            );
            expect(state.chatMessages).toEqual([
                {
                    senderId: "senderId",
                    timestamp: "123",
                    text: "text",
                },
            ]);
        });
    });
});
