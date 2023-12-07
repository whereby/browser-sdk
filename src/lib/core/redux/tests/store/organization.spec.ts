import { diff } from "deep-object-diff";
import { doOrganizationFetch } from "../../slices/organization";
import { createStore, mockServices } from "../store.setup";

describe("actions", () => {
    it("doOrganizationFetch", async () => {
        mockServices.fetchOrganizationFromRoomUrl.mockResolvedValueOnce({
            organizationId: "orgId",
            organizationName: "orgName",
        });
        const store = createStore();

        const before = store.getState().organization;

        await store.dispatch(doOrganizationFetch());

        const after = store.getState().organization;

        expect(mockServices.fetchOrganizationFromRoomUrl).toHaveBeenCalled();
        expect(diff(before, after)).toEqual({
            data: {
                organizationId: "orgId",
                organizationName: "orgName",
            },
        });
    });
});
