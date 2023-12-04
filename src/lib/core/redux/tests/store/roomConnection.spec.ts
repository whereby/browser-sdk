import { createStore, mockSignalEmit } from "../store.setup";
import { doKnockRoom, doConnectRoom } from "../../slices/roomConnection";

describe("doKnockRoom", () => {
    it("should emit knock_room", async () => {
        const store = createStore({ withSignalConnection: true });

        store.dispatch(doKnockRoom());

        expect(mockSignalEmit).toHaveBeenCalledWith("knock_room", expect.any(Object));
    });
});

describe("doConnectRoom", () => {
    it("should emit join_room", async () => {
        const store = createStore({ withSignalConnection: true });

        store.dispatch(doConnectRoom());

        expect(mockSignalEmit).toHaveBeenCalledWith("join_room", expect.any(Object));
    });
});
