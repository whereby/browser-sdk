import { doOrganizationFetch } from "../../slices/organization";
import { createStore, mockServices } from "../store.setup";

describe("doOrganizationFetch", () => {
    it("should call fetchOrganizationFromRoomUrl", async () => {
        const store = createStore();

        await store.dispatch(doOrganizationFetch());

        expect(mockServices.fetchOrganizationFromRoomUrl).toHaveBeenCalled();
    });
});
