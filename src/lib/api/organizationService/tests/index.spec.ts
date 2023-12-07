import ApiClient from "../../ApiClient";
import _omit from "lodash/omit";
import OrganizationService from "../index";
import Organization from "../../models/Organization";
import Response from "../../Response";
import { itShouldThrowIfInvalid, itShouldRejectIfApiClientRejects } from "../../__tests__/helpers";
import { ConsentGrantRequest } from "../../types";

jest.mock("../../ApiClient");

function createOrganizationResponseObjectFromId(organizationId: string) {
    return {
        organizationId,
        organizationName: "orgName-" + organizationId,
        subdomain: "subdomain-" + organizationId,
        permissions: {},
        limits: {},
    };
}

function createOrganizationFromResponseObject(responseObject: Record<string, unknown>) {
    return Organization.fromJson({
        permissions: {},
        limits: {},
        ...responseObject,
    });
}

describe("organizationService", () => {
    let apiClient: jest.Mocked<ApiClient>;
    let organizationService: OrganizationService;
    const organizationId = "1";
    const organizationName = "some-name";
    const subdomain = "someOrganization";
    const verificationCode = "someVerificationCode";
    const permissions = {
        images: {
            logoImageUrl: {
                set: {
                    isAllowed: true,
                    isSupported: true,
                },
                reset: {
                    isAllowed: true,
                    isSupported: true,
                },
            },
            roomBackgroundImageUrl: {
                set: {
                    isAllowed: true,
                    isSupported: true,
                },
                reset: {
                    isAllowed: true,
                    isSupported: true,
                },
            },
            roomKnockPageBackgroundImageUrl: {
                set: {
                    isAllowed: true,
                    isSupported: true,
                },
                reset: {
                    isAllowed: true,
                    isSupported: true,
                },
            },
        },
        invitations: {
            add: {
                isAllowed: true,
                isSupported: true,
            },
            delete: {
                isAllowed: true,
                isSupported: true,
            },
            list: {
                isAllowed: true,
                isSupported: true,
            },
        },
        roles: {
            set: {
                isAllowed: true,
                isSupported: true,
            },
            remove: {
                isAllowed: true,
                isSupported: true,
            },
            removeSelf: {
                isAllowed: true,
                isSupported: true,
            },
            list: {
                isAllowed: true,
                isSupported: true,
            },
        },
        users: {
            signUpWithoutInvitation: {
                isAllowed: true,
                isSupported: true,
            },
        },
        rooms: {
            customize: {
                isAllowed: true,
                isSupported: true,
            },
            customizeSelf: {
                isAllowed: true,
                isSupported: true,
            },
            list: {
                isAllowed: true,
                isSupported: true,
            },
            lock: {
                isAllowed: true,
                isSupported: true,
            },
            unclaim: {
                isAllowed: true,
                isSupported: true,
            },
            unclaimSelf: {
                isAllowed: true,
                isSupported: true,
            },
        },
        subscriptions: {
            add: {
                isAllowed: true,
                isSupported: true,
            },
            list: {
                isAllowed: true,
                isSupported: true,
            },
            payLatestInvoice: {
                isAllowed: true,
                isSupported: true,
            },
            updatePlan: {
                isAllowed: true,
                isSupported: true,
            },
        },
        browserExtension: {
            install: {
                isAllowed: true,
                isSupported: true,
            },
        },
    };
    const limits = {
        maxNumberOfInvitationsAndUsers: null,
        maxNumberOfClaimedRooms: null,
        maxRoomLimitPerOrganization: null,
    };

    beforeEach(() => {
        apiClient = new ApiClient() as jest.Mocked<ApiClient>;

        organizationService = new OrganizationService({ apiClient });
    });

    describe("createOrganization", () => {
        const consents: Array<ConsentGrantRequest> = [
            {
                consentRevisionId: "Test consentRevisionId",
                action: "rejected",
            },
        ];
        const emailOwner = {
            email: "owner-email@example.com",
            verificationCode,
            displayName: "owner-displayName",
            consents,
        };
        const idTokenOwner = {
            idToken: "mockIdToken",
            displayName: "owner-displayName",
        };
        const createOrganizationArgs = {
            subdomain,
            organizationName,
        };
        const createOrganizationWithEmailArgs = {
            ...createOrganizationArgs,
            owner: emailOwner,
        };
        const createOrganizationWithIdTokenArgs = {
            ...createOrganizationArgs,
            owner: idTokenOwner,
        };

        const createdOrganization = {
            organizationId,
            permissions: {},
            limits: {},
        };

        describe("when missing arguments", () => {
            itShouldThrowIfInvalid("subdomain", () => {
                // @ts-expect-error
                organizationService.createOrganization(_omit(createOrganizationWithEmailArgs, "subdomain"));
            });

            itShouldThrowIfInvalid("organizationName", () => {
                // @ts-expect-error
                organizationService.createOrganization(_omit(createOrganizationWithEmailArgs, "organizationName"));
            });

            itShouldThrowIfInvalid("owner.email or owner.idToken", () => {
                organizationService.createOrganization({
                    ...createOrganizationArgs,
                    //@ts-expect-error
                    owner: { displayName: idTokenOwner.displayName },
                });
            });

            describe("owner.email", () => {
                itShouldThrowIfInvalid("owner.verificationCode", () => {
                    organizationService.createOrganization({
                        ...createOrganizationWithEmailArgs,
                        //@ts-expect-error
                        owner: _omit(createOrganizationWithEmailArgs.owner, "verificationCode"),
                    });
                });
            });

            describe("owner.idToken", () => {
                itShouldThrowIfInvalid("owner.idToken", () => {
                    organizationService.createOrganization({
                        ...createOrganizationWithIdTokenArgs,
                        //@ts-expect-error
                        owner: {
                            ..._omit(createOrganizationWithIdTokenArgs.owner, "idToken"),
                        },
                    });
                });
            });

            itShouldThrowIfInvalid("owner.displayName", () => {
                organizationService.createOrganization({
                    ...createOrganizationWithEmailArgs,
                    //@ts-expect-error
                    owner: _omit(createOrganizationWithEmailArgs.owner, "displayName"),
                });
            });

            itShouldThrowIfInvalid("consents", () => {
                organizationService.createOrganization({
                    ...createOrganizationWithIdTokenArgs,
                    owner: {
                        ...createOrganizationWithIdTokenArgs.owner,
                        //@ts-expect-error
                        consents: "invalid",
                    },
                });
            });
        });

        describe("when using email", () => {
            it("should resolve with the organizationId of the created organization", async () => {
                apiClient.request.mockResolvedValue(
                    new Response({
                        status: 200,
                        data: {
                            ...createdOrganization,
                            ...createOrganizationWithEmailArgs,
                        },
                    })
                );

                const result = await organizationService.createOrganization(createOrganizationWithEmailArgs);

                expect(result).toEqual(createdOrganization.organizationId);
            });

            it("should correctly format the API request", () => {
                const expectedUrl = `/organizations`;
                apiClient.request.mockResolvedValue(
                    new Response({
                        status: 200,
                        data: {
                            ...createdOrganization,
                            ...createOrganizationWithEmailArgs,
                        },
                    })
                );

                const promise = organizationService.createOrganization(createOrganizationWithEmailArgs);

                return promise.then(() => {
                    expect(apiClient.request).toBeCalledWith(expectedUrl, {
                        method: "POST",
                        data: {
                            owner: {
                                displayName: createOrganizationWithEmailArgs.owner.displayName,
                                email: {
                                    value: createOrganizationWithEmailArgs.owner.email,
                                    verificationCode: createOrganizationWithEmailArgs.owner.verificationCode,
                                },
                                consents: createOrganizationWithEmailArgs.owner.consents,
                            },
                            organizationName: createOrganizationWithEmailArgs.organizationName,
                            subdomain: createOrganizationWithEmailArgs.subdomain,
                            type: "private",
                        },
                    });
                });
            });
        });

        describe("when using idToken", () => {
            it("should resolve with the organizationId of the created organization", async () => {
                apiClient.request.mockResolvedValue(
                    new Response({
                        status: 200,
                        data: {
                            ...createdOrganization,
                            ...createOrganizationWithIdTokenArgs,
                        },
                    })
                );

                const result = await organizationService.createOrganization(createOrganizationWithIdTokenArgs);

                expect(result).toEqual(createdOrganization.organizationId);
            });

            it("should correctly format the API request", () => {
                const expectedUrl = `/organizations`;
                apiClient.request.mockResolvedValue(
                    new Response({
                        status: 200,
                        data: {
                            ...createdOrganization,
                            ...createOrganizationWithIdTokenArgs,
                        },
                    })
                );

                const promise = organizationService.createOrganization(createOrganizationWithIdTokenArgs);

                return promise.then(() => {
                    expect(apiClient.request).toBeCalledWith(expectedUrl, {
                        method: "POST",
                        data: {
                            owner: {
                                displayName: createOrganizationWithIdTokenArgs.owner.displayName,
                                idToken: createOrganizationWithIdTokenArgs.owner.idToken,
                            },
                            organizationName: createOrganizationWithIdTokenArgs.organizationName,
                            subdomain: createOrganizationWithIdTokenArgs.subdomain,
                            type: "private",
                        },
                    });
                });
            });
        });
    });

    describe("getOrganizationBySubdomain", () => {
        beforeEach(() => {
            apiClient.request.mockRejectedValue(new Error("Called request method with unexpected parameters"));
        });

        itShouldThrowIfInvalid("subdomain", () => {
            //@ts-expect-error
            organizationService.getOrganizationBySubdomain(null);
        });

        itShouldRejectIfApiClientRejects(
            () => apiClient,
            () => organizationService.getOrganizationBySubdomain(subdomain)
        );

        it("should return null if no matching organization was found", async () => {
            apiClient.request.mockRejectedValue(
                new Response({
                    status: 404,
                })
            );

            const result = await organizationService.getOrganizationBySubdomain(subdomain);

            expect(result).toEqual(null);
        });

        it("should return the matching organization", async () => {
            const data = {
                organizationId,
                organizationName,
                subdomain,
                permissions,
                limits,
            };
            apiClient.request.mockResolvedValue(
                new Response({
                    status: 200,
                    data,
                })
            );

            const result = await organizationService.getOrganizationBySubdomain(subdomain);

            expect(result).toEqual(Organization.fromJson(data));
        });

        it("should support retrieving organization with empty subdomain", async () => {
            apiClient.request.mockResolvedValue(
                new Response({
                    status: 200,
                    data: {
                        organizationId,
                        organizationName,
                        subdomain,
                        permissions,
                        limits,
                    },
                })
            );

            const result = await organizationService.getOrganizationBySubdomain("");

            expect(result).toEqual(
                Organization.fromJson({
                    organizationId,
                    organizationName,
                    subdomain,
                    permissions,
                    limits,
                })
            );
        });
    });

    describe("getOrganizationByOrganizationId", () => {
        beforeEach(() => {
            const response = new Response({ status: 200, data: {} });
            apiClient.request.mockResolvedValue(response);
        });

        itShouldThrowIfInvalid("organizationId", () => {
            //@ts-expect-error
            organizationService.getOrganizationByOrganizationId(null);
        });

        itShouldRejectIfApiClientRejects(
            () => apiClient,
            () => organizationService.getOrganizationByOrganizationId(organizationId)
        );

        it("should return null if no matching organization was found", async () => {
            apiClient.request.mockRejectedValue(
                new Response({
                    status: 404,
                })
            );

            const result = await organizationService.getOrganizationByOrganizationId(organizationId);

            expect(result).toEqual(null);
        });

        it("should return the matching organization", async () => {
            apiClient.request.mockResolvedValue(
                new Response({
                    status: 200,
                    data: {
                        organizationId,
                        organizationName,
                        subdomain,
                        permissions,
                        limits,
                    },
                })
            );

            const result = await organizationService.getOrganizationByOrganizationId(organizationId);

            expect(result).toEqual(
                Organization.fromJson({
                    organizationId,
                    organizationName,
                    subdomain,
                    permissions,
                    limits,
                })
            );
        });
    });

    describe("getOrganizationsByContactPoint", () => {
        let email: string;
        let phoneNumber: string;
        let code: string;

        beforeEach(() => {
            email = "some-email@example.com";
            phoneNumber = "+111";
            code = "some code";

            const response = new Response({
                status: 200,
                data: {
                    organizations: [],
                },
            });
            apiClient.request.mockResolvedValue(response);
        });

        itShouldThrowIfInvalid("code", () => {
            // @ts-expect-error
            organizationService.getOrganizationsByContactPoint({ email });
        });

        it("should throw if both email and phoneNumber are missing", () => {
            expect(() => {
                // @ts-expect-error
                organizationService.getOrganizationsByContactPoint({ code });
            }).toThrowError("email or phoneNumber is required");
        });

        it("should throw if both email and phoneNumber are provided", () => {
            expect(() => {
                organizationService.getOrganizationsByContactPoint({ email, phoneNumber, code });
            }).toThrowError("email or phoneNumber is required");
        });

        itShouldRejectIfApiClientRejects(
            () => apiClient,
            () => organizationService.getOrganizationsByContactPoint({ email, code })
        );

        describe("when phoneNumber is provided", () => {
            it("should return empty array if no matching organizations were found", async () => {
                apiClient.request.mockResolvedValue(
                    new Response({
                        status: 200,
                        data: { organizations: [] },
                    })
                );

                const result = await organizationService.getOrganizationsByContactPoint({ phoneNumber, code });

                expect(result).toEqual([]);
            });

            it("should return the matching organizations", async () => {
                const organizationsPayload = ["1", "2", "3"].map(createOrganizationResponseObjectFromId);
                const expectedOrganizations = organizationsPayload.map(createOrganizationFromResponseObject);
                apiClient.request.mockResolvedValue(
                    new Response({
                        status: 200,
                        data: { organizations: organizationsPayload },
                    })
                );

                const result = await organizationService.getOrganizationsByContactPoint({ phoneNumber, code });

                expect(result).toEqual(expectedOrganizations);
            });
        });

        describe("when email is provided", () => {
            it("should return empty array if no matching organizations were found", async () => {
                apiClient.request.mockResolvedValue(
                    new Response({
                        status: 200,
                        data: {
                            organizations: [],
                        },
                    })
                );

                const result = await organizationService.getOrganizationsByContactPoint({ email, code });

                expect(result).toEqual([]);
            });

            it("should return the matching organizations", async () => {
                const organizationsPayload = ["1", "2", "3"].map(createOrganizationResponseObjectFromId);
                const expectedOrganizations = organizationsPayload.map(createOrganizationFromResponseObject);
                apiClient.request.mockResolvedValue(
                    new Response({
                        status: 200,
                        data: { organizations: organizationsPayload },
                    })
                );

                const result = await organizationService.getOrganizationsByContactPoint({ email, code });

                expect(result).toEqual(expectedOrganizations);
            });
        });
    });

    describe("getOrganizationsByIdToken", () => {
        let idToken: string;

        beforeEach(() => {
            idToken = "some-id-token";

            const response = new Response({
                status: 200,
                data: {
                    organizations: [],
                },
            });
            apiClient.request.mockResolvedValue(response);
        });

        itShouldThrowIfInvalid("idToken", () => {
            // @ts-expect-error
            organizationService.getOrganizationsByIdToken({});
        });

        itShouldRejectIfApiClientRejects(
            () => apiClient,
            () => organizationService.getOrganizationsByIdToken({ idToken })
        );

        describe("when idToken is provided", () => {
            it("should return empty array if no matching organizations were found", async () => {
                apiClient.request.mockResolvedValue(
                    new Response({
                        status: 200,
                        data: { organizations: [] },
                    })
                );

                const result = await organizationService.getOrganizationsByIdToken({ idToken });

                expect(result).toEqual([]);
            });

            it("should return the matching organizations", async () => {
                const organizationsPayload = ["1", "2", "3"].map(createOrganizationResponseObjectFromId);
                const expectedOrganizations = organizationsPayload.map(createOrganizationFromResponseObject);
                apiClient.request.mockResolvedValue(
                    new Response({
                        status: 200,
                        data: { organizations: organizationsPayload },
                    })
                );

                const result = await organizationService.getOrganizationsByIdToken({ idToken });

                expect(result).toEqual(expectedOrganizations);
            });
        });
    });

    describe("getOrganizationsByLoggedInUser", () => {
        beforeEach(() => {
            const response = new Response({
                status: 200,
                data: {
                    organizations: [],
                },
            });
            apiClient.request.mockResolvedValue(response);
        });

        itShouldRejectIfApiClientRejects(
            () => apiClient,
            () => organizationService.getOrganizationsByLoggedInUser()
        );

        it("should return empty array if no matching organizations were found", async () => {
            apiClient.request.mockResolvedValue(
                new Response({
                    status: 200,
                    data: { organizations: [] },
                })
            );

            const result = await organizationService.getOrganizationsByLoggedInUser();

            return expect(result).toEqual([]);
        });

        it("should return the matching organizations", async () => {
            const organizationsPayload = ["1", "2", "3"].map(createOrganizationResponseObjectFromId);
            const expectedOrganizations = organizationsPayload.map(createOrganizationFromResponseObject);
            apiClient.request.mockResolvedValue(
                new Response({
                    status: 200,
                    data: { organizations: organizationsPayload },
                })
            );

            const result = await organizationService.getOrganizationsByLoggedInUser();

            expect(result).toEqual(expectedOrganizations);
        });
    });

    describe("getSubdomainAvailability", () => {
        itShouldThrowIfInvalid("subdomain", () => {
            //@ts-expect-error
            organizationService.getSubdomainAvailability(null);
        });

        itShouldRejectIfApiClientRejects(
            () => apiClient,
            () => organizationService.getSubdomainAvailability(subdomain)
        );

        it("should return the data provided by the server", async () => {
            const data = {
                status: "available",
            };
            apiClient.request.mockResolvedValue(
                new Response({
                    status: 200,
                    data,
                })
            );

            const result = await organizationService.getSubdomainAvailability(subdomain);

            expect(result).toEqual(data);
        });
    });

    describe("updatePreferences", () => {
        itShouldRejectIfApiClientRejects(
            () => apiClient,
            () => organizationService.updatePreferences({ organizationId: "2", preferences: {} })
        );

        it("should update preferences", async () => {
            const expectedUrl = `/organizations/${organizationId}/preferences`;
            const preferences = { someKey: "some value" };
            apiClient.request.mockResolvedValue(new Response({ status: 204, data: null }));

            await organizationService.updatePreferences({ organizationId, preferences });

            expect(apiClient.request).toBeCalledWith(expectedUrl, {
                method: "PATCH",
                data: preferences,
            });
        });
    });

    describe("deleteOrganization", () => {
        itShouldRejectIfApiClientRejects(
            () => apiClient,
            () => organizationService.deleteOrganization({ organizationId: "2" })
        );

        it("should delete organization", async () => {
            const expectedUrl = `/organizations/${organizationId}`;
            apiClient.request.mockResolvedValue(new Response({ status: 204, data: null }));

            await organizationService.deleteOrganization({ organizationId });

            expect(apiClient.request).toBeCalledWith(expectedUrl, {
                method: "DELETE",
            });
        });
    });
});
