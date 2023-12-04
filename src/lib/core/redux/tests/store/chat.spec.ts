import { createStore, mockSignalEmit } from "../store.setup";
import { doSendChatMessage } from "../../slices/chat";

describe("doSendChatMessage", () => {
    it("should emit chat_message", async () => {
        const store = createStore({ withSignalConnection: true });

        store.dispatch(doSendChatMessage({ text: "text" }));

        expect(mockSignalEmit).toHaveBeenCalledWith("chat_message", { text: "text" });
    });
});
