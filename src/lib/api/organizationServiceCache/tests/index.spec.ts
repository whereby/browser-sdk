// @ts-nocheck
import ApiClient from "../../ApiClient";
import OrganizationServiceCache from "../index";
import OrganizationService from "../../organizationService";
import Organization from "../../models/Organization";

jest.mock("../../organizationService");

describe("OrganizationServiceCache", () => {
    let apiClient: jest.Mocked<ApiClient>;
    let organizationService: OrganizationService;
    let organizationServiceCache: OrganizationServiceCache;
    let subdomain: string | undefined;
    let organization: Organization;

    beforeEach(() => {
        subdomain = "someOrganization";
        const permissions = {};
        const limits = {
            maxNumberOfClaimedRooms: null,
        };
        apiClient = new ApiClient() as jest.Mocked<ApiClient>;

        organization = new Organization({
            organizationId: "1",
            organizationName: "some-name",
            subdomain: "someOrganization",
            permissions,
            limits,
        });
        organizationService = new OrganizationService({ apiClient });
        organizationService.getOrganizationBySubdomain.mockResolvedValue(organization);
        organizationServiceCache = new OrganizationServiceCache({
            subdomain,
            organizationService,
        });
    });

    describe("initOrganization", () => {
        it("should do nothing", async () => {
            await organizationServiceCache.initOrganization();

            expect(organizationService.getOrganizationBySubdomain).toBeCalledWith(subdomain);
        });

        it("should resolve with undefined", async () => {
            const result = await organizationServiceCache.initOrganization();

            expect(result).toBeUndefined();
        });
    });

    describe("fetchOrganization", () => {
        describe("when cache is uninitialized", () => {
            it("should fetch the organization state", async () => {
                await organizationServiceCache.fetchOrganization();

                expect(organizationService.getOrganizationBySubdomain).toBeCalledWith(subdomain);
            });
        });

        describe("when organization has been fetched once", () => {
            beforeEach(() => {
                return organizationServiceCache.fetchOrganization();
            });

            it("should do nothing", async () => {
                organizationServiceCache.fetchOrganization();

                expect(organizationService.getOrganizationBySubdomain).toBeCalledWith(subdomain);
            });
        });

        it("should return the organization returned from the organizationService", async () => {
            const result = await organizationServiceCache.fetchOrganization();

            expect(result).toEqual(organization);
        });
    });
});
