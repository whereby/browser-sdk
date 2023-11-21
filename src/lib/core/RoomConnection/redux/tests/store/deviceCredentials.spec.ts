import { doGetDeviceCredentials } from "../../slices/deviceCredentials";
import { createStore, mockServices } from "../store.setup";

describe("doGetDeviceCredentials", () => {
    it("should call credentialsService.getCredentials", async () => {
        const store = createStore();

        await store.dispatch(doGetDeviceCredentials());

        expect(mockServices.credentialsService.getCredentials).toHaveBeenCalled();
    });

    it("should set deviceCredentials.data", async () => {
        mockServices.credentialsService.getCredentials.mockResolvedValueOnce({
            credentials: { uuid: "uuid" },
            hmac: "hmac",
            userId: "userId",
        });

        const store = createStore();

        await store.dispatch(doGetDeviceCredentials());

        expect(store.getState().deviceCredentials.data).toEqual({
            credentials: { uuid: "uuid" },
            hmac: "hmac",
            userId: "userId",
        });
    });
});
