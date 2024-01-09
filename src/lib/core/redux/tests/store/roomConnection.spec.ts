import { createStore, mockSignalEmit } from "../store.setup";
import { doKnockRoom, doConnectRoom } from "../../slices/roomConnection";
import { diff } from "deep-object-diff";

describe("actions", () => {
    it("doKnockRoom", async () => {
        const store = createStore({ withSignalConnection: true });

        const before = store.getState().roomConnection;

        store.dispatch(doKnockRoom());

        const after = store.getState().roomConnection;

        expect(mockSignalEmit).toHaveBeenCalledWith("knock_room", expect.any(Object));
        expect(diff(before, after)).toEqual({
            status: "knocking",
        });
    });

    it("doConnectRoom", async () => {
        const store = createStore({ withSignalConnection: true });

        const before = store.getState().roomConnection;

        store.dispatch(doConnectRoom());

        const after = store.getState().roomConnection;

        expect(mockSignalEmit).toHaveBeenCalledWith("join_room", expect.any(Object));
        expect(diff(before, after)).toEqual({
            status: "connecting",
        });
    });
});
