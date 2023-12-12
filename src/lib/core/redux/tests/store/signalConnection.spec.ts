import { createStore, mockSignalEmit, mockServerSocket } from "../store.setup";
import {
    doSignalSocketConnect,
    doSignalIdentifyDevice,
    doSignalDisconnect,
    doSignalReconnect,
} from "../../slices/signalConnection";
import { randomDeviceCredentials } from "../../../../../lib/__mocks__/appMocks";
import { diff } from "deep-object-diff";
import ServerSocket from "@whereby/jslib-media/src/utils/ServerSocket";

jest.mock("@whereby/jslib-media/src/utils/ServerSocket", () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => {
            return mockServerSocket;
        }),
    };
});

describe("actions", () => {
    it("doSignalSocketConnect", () => {
        const store = createStore();

        store.dispatch(doSignalSocketConnect());

        expect(ServerSocket).toHaveBeenCalledTimes(1);
        expect(mockServerSocket.connect).toHaveBeenCalledTimes(1);
    });

    it("doSignalIdentifyDevice", () => {
        const deviceCredentials = randomDeviceCredentials();
        const store = createStore({ withSignalConnection: true });

        const before = store.getState().signalConnection;

        store.dispatch(doSignalIdentifyDevice({ deviceCredentials }));

        const after = store.getState().signalConnection;

        expect(mockSignalEmit).toHaveBeenCalledWith("identify_device", { deviceCredentials });
        expect(diff(before, after)).toEqual({
            isIdentifyingDevice: true,
        });
    });

    it("doSignalDisconnect", () => {
        const store = createStore({ withSignalConnection: true });

        const before = store.getState().signalConnection;

        store.dispatch(doSignalDisconnect());

        const after = store.getState().signalConnection;

        expect(mockSignalEmit).toHaveBeenCalledWith("leave_room");
        expect(mockServerSocket.disconnect).toHaveBeenCalled();
        expect(diff(before, after)).toEqual({
            status: "disconnected",
        });
    });

    it("doSignalReconnect", () => {
        const deviceCredentials = randomDeviceCredentials();
        const store = createStore({
            withSignalConnection: true,
            initialState: {
                deviceCredentials: {
                    data: deviceCredentials,
                    isFetching: false,
                },
            },
        });

        const before = store.getState().signalConnection;

        store.dispatch(doSignalReconnect());

        const after = store.getState().signalConnection;

        expect(mockSignalEmit).toHaveBeenCalledWith("identify_device", { deviceCredentials });
        expect(diff(before, after)).toEqual({
            isIdentifyingDevice: true,
            status: "reconnect",
        });
    });
});
