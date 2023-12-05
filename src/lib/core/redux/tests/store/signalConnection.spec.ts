import { createStore, mockSignalEmit } from "../store.setup";
import { doSignalIdentifyDevice, doSignalDisconnect } from "../../slices/signalConnection";
import { randomDeviceCredentials } from "../../../../../lib/__mocks__/appMocks";

describe("actions", () => {
    it("doSignalIdentifyDevice", async () => {
        const deviceCredentials = randomDeviceCredentials();
        const store = createStore({ withSignalConnection: true });

        store.dispatch(doSignalIdentifyDevice({ deviceCredentials }));

        expect(mockSignalEmit).toHaveBeenCalledWith("identify_device", { deviceCredentials });
    });

    it("doSignalDisconnect", async () => {
        const store = createStore({ withSignalConnection: true });

        store.dispatch(doSignalDisconnect());

        expect(mockSignalEmit).toHaveBeenCalledWith("leave_room");
    });
});
