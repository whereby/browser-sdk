// @ts-nocheck
import sinon from "sinon";
import OrganizationServiceCache from "../index";
import OrganizationService from "../../organizationService";
import Organization from "../../models/Organization";
import { itShouldThrowIfInvalid } from "../../test/helpers";

describe("OrganizationServiceCache", () => {
    let organizationService;
    let organizationServiceCache;
    let subdomain;
    let organization;

    beforeEach(() => {
        subdomain = "someOrganization";
        const permissions = {};
        const limits = {
            maxNumberOfClaimedRooms: null,
        };

        organization = new Organization({
            organizationId: "1",
            organizationName: "some-name",
            subdomain: "someOrganization",
            permissions,
            limits,
        });
        organizationService = sinon.createStubInstance(OrganizationService);
        organizationService.getOrganizationBySubdomain.resolves(organization);
        organizationServiceCache = new OrganizationServiceCache({
            subdomain,
            organizationService,
        });
    });

    describe("constructor", () => {
        itShouldThrowIfInvalid(
            "subdomain",
            () =>
                new OrganizationServiceCache({
                    subdomain: undefined,
                    organizationService,
                })
        );

        itShouldThrowIfInvalid(
            "organizationService",
            () =>
                new OrganizationServiceCache({
                    subdomain,
                    organizationService: undefined,
                })
        );
    });

    describe("initOrganization", () => {
        describe("when cache is uninitialized", () => {
            it("should fetch the organization", () => {
                const promise = organizationServiceCache.initOrganization();

                return promise.then(() => {
                    expect(
                        organizationService.getOrganizationBySubdomain.withArgs(subdomain)
                    ).to.have.been.calledOnce();
                });
            });
        });

        describe("when cache is initialized", () => {
            beforeEach(() => {
                return organizationServiceCache.initOrganization();
            });

            it("should do nothing", () => {
                const promise = organizationServiceCache.initOrganization();

                return promise.then(() => {
                    expect(
                        organizationService.getOrganizationBySubdomain.withArgs(subdomain)
                    ).to.have.been.calledOnce();
                });
            });
        });

        it("should resolve with undefined", async () => {
            const result = await organizationServiceCache.initOrganization();

            expect(result).to.eql(undefined);
        });
    });

    describe("fetchOrganization", () => {
        describe("when cache is uninitialized", () => {
            it("should fetch the organization state", () => {
                const promise = organizationServiceCache.fetchOrganization();

                return promise.then(() => {
                    expect(
                        organizationService.getOrganizationBySubdomain.withArgs(subdomain)
                    ).to.have.been.calledOnce();
                });
            });
        });

        describe("when organization has been fetched once", () => {
            beforeEach(() => {
                return organizationServiceCache.fetchOrganization();
            });

            it("should do nothing", () => {
                const promise = organizationServiceCache.fetchOrganization();

                return promise.then(() => {
                    expect(
                        organizationService.getOrganizationBySubdomain.withArgs(subdomain)
                    ).to.have.been.calledOnce();
                });
            });
        });

        it("should return the organization returned from the organizationService", async () => {
            const result = await organizationServiceCache.fetchOrganization();

            expect(result).to.eql(organization);
        });
    });
});
