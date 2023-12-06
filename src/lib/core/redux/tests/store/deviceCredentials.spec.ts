import { diff } from "deep-object-diff";
import { doGetDeviceCredentials } from "../../slices/deviceCredentials";
import { createStore, mockServices } from "../store.setup";

describe("actions", () => {
    it("doGetDeviceCredentials", async () => {
        mockServices.credentialsService.getCredentials.mockResolvedValueOnce({
            credentials: { uuid: "uuid" },
            hmac: "hmac",
            userId: "userId",
        });
        const store = createStore();

        const before = store.getState().deviceCredentials;

        await store.dispatch(doGetDeviceCredentials());

        const after = store.getState().deviceCredentials;

        expect(mockServices.credentialsService.getCredentials).toHaveBeenCalled();
        expect(store.getState().deviceCredentials.data).toEqual({
            credentials: { uuid: "uuid" },
            hmac: "hmac",
            userId: "userId",
        });
        expect(diff(before, after)).toEqual({
            data: {
                credentials: { uuid: "uuid" },
                hmac: "hmac",
                userId: "userId",
            },
        });
    });
});
