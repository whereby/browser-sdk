import { createStore, mockSignalEmit } from "../store.setup";
import { doAcceptWaitingParticipant, doRejectWaitingParticipant } from "../../slices/waitingParticipants";

describe("doAcceptWaitingParticipant", () => {
    it("should emit handle_knock", async () => {
        const participantId = "participantId";
        const store = createStore({ withSignalConnection: true });

        store.dispatch(doAcceptWaitingParticipant({ participantId }));

        expect(mockSignalEmit).toHaveBeenCalledWith("handle_knock", {
            action: "accept",
            clientId: participantId,
            response: {},
        });
    });
});

describe("doRejectWaitingParticipant", () => {
    it("should emit handle_knock", async () => {
        const participantId = "participantId";
        const store = createStore({ withSignalConnection: true });

        store.dispatch(doRejectWaitingParticipant({ participantId }));

        expect(mockSignalEmit).toHaveBeenCalledWith("handle_knock", {
            action: "reject",
            clientId: participantId,
            response: {},
        });
    });
});
