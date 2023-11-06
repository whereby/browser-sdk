import assert from "@whereby/jslib-media/src/utils/assert";
import Organization, { OrganizationPreferences } from "../models/Organization";
import {
    assertInstanceOf,
    assertTruthy,
    assertString,
    assertArray,
    assertNullOrString,
    assertRecord,
} from "../parameterAssertUtils";
import ApiClient from "../ApiClient";
import Response from "../Response";
import { extractArray, extractString } from "../extractUtils";
import { ConsentGrantRequest } from "../types";

export default class OrganizationService {
    _apiClient: ApiClient;

    constructor({ apiClient }: { apiClient: ApiClient }) {
        // apiClient is added since it will be used eventually or rather soon.
        // this is to avoid the api to be broken again
        this._apiClient = apiClient;
    }

    /**
     * Creates an organization.
     */
    createOrganization({
        organizationName,
        subdomain,
        owner,
    }: {
        organizationName: string;
        subdomain: string;
        owner:
            | {
                  email: string;
                  displayName: string;
                  verificationCode: string;
                  consents?: ReadonlyArray<ConsentGrantRequest>;
              }
            | {
                  idToken: string;
                  displayName: string;
                  consents?: ReadonlyArray<ConsentGrantRequest>;
              };
    }): Promise<string> {
        const { displayName, consents } = owner || {};
        const email =
            "email" in owner
                ? {
                      value: owner.email,
                      verificationCode: assertString(owner.verificationCode, "owner.verificationCode"),
                  }
                : null;
        const idToken = "idToken" in owner ? owner.idToken : null;
        assertString(subdomain, "subdomain");
        assertString(organizationName, "organizationName");
        assertString(displayName, "owner.displayName");
        assert.ok(email || idToken, "owner.email or owner.idToken is required");

        if (consents) {
            assertArray(consents, "consents");
            for (const { consentRevisionId, action } of consents) {
                assertString(consentRevisionId, "consentRevisionId");
                assertNullOrString(action, "action");
            }
        }

        return this._apiClient
            .request(`/organizations`, {
                method: "POST",
                data: {
                    organizationName,
                    type: "private",
                    subdomain,
                    owner: {
                        ...(email && { email }),
                        ...(idToken && { idToken }),
                        ...(consents && { consents }),
                        displayName,
                    },
                },
            })
            .then(({ data }) => {
                return extractString(data, "organizationId");
            });
    }

    /**
     * Retrieves the organization based on the subdomain.
     */
    getOrganizationBySubdomain(subdomain: string): Promise<Organization | null> {
        assertString(subdomain, "subdomain");

        return this._apiClient
            .request(
                `/organization-subdomains/${encodeURIComponent(
                    subdomain
                )}/?fields=permissions,account,onboardingSurvey`,
                {
                    method: "GET",
                }
            )

            .then(({ data }) => {
                return Organization.fromJson(data);
            })
            .catch((res) => {
                if (res instanceof Response) {
                    if (res.status === 404) {
                        return null;
                    }

                    throw new Error(res.statusText);
                }

                throw res;
            });
    }

    /**
     * Retrieves the organization based on the organizationId.
     *
     * Note: This endpoint should only be used to retrieve an organization when the device is linked
     * to a user in that organization. Use getOrganizationBySubdomain instead if you just want the information
     * about an organization that is mapped to a given subdomain.
     */
    getOrganizationByOrganizationId(organizationId: string): Promise<Organization | null> {
        assertString(organizationId, "organizationId");

        return this._apiClient
            .request(`/organizations/${encodeURIComponent(organizationId)}?fields=permissions,account`, {
                method: "GET",
            })
            .then(({ data }) => {
                return Organization.fromJson(data);
            })
            .catch((res) => {
                if (res instanceof Response) {
                    if (res.status === 404) {
                        return null;
                    }

                    throw new Error(res.statusText);
                }

                throw res;
            });
    }

    /**
     * Retrieves the organizations that contain a user
     * matching provided the email+code or phoneNumber+code
     * combination.
     */
    getOrganizationsByContactPoint(
        options:
            | {
                  email: string;
                  code: string;
              }
            | {
                  phoneNumber: string;
                  code: string;
              }
    ): Promise<ReadonlyArray<Organization>> {
        const { code } = options;
        const email = "email" in options ? options.email : null;
        const phoneNumber = "phoneNumber" in options ? options.phoneNumber : null;
        assert.ok((email || phoneNumber) && !(email && phoneNumber), "either email or phoneNumber is required");
        assertString(code, "code");

        const contactPoint = email ? { type: "email", value: email } : { type: "phoneNumber", value: phoneNumber };
        return this._apiClient
            .request("/organization-queries", {
                method: "POST",
                data: {
                    contactPoint,
                    code,
                },
            })
            .then(({ data }) => {
                return extractArray(data, "organizations", (organization) => Organization.fromJson(organization));
            });
    }

    /**
     * Retrieves the organizations that contain a user
     * matching provided the idToken
     */
    getOrganizationsByIdToken({ idToken }: { idToken: string }): Promise<ReadonlyArray<Organization>> {
        assertString(idToken, "idToken");

        return this._apiClient
            .request("/organization-queries", {
                method: "POST",
                data: {
                    idToken,
                },
            })
            .then(({ data }) => {
                return extractArray(data, "organizations", (organization) => {
                    return Organization.fromJson({
                        permissions: {},
                        limits: {},
                        ...assertRecord(organization, "organization"),
                    });
                });
            });
    }

    /**
     * Retrieves the organizations containing a user
     * with either the email or phoneNumber matching the logged in user.
     *
     * This is useful for showing the possible organization that the current
     * user could log in to.
     */
    getOrganizationsByLoggedInUser(): Promise<ReadonlyArray<Organization>> {
        return this._apiClient
            .request("/user/organizations", {
                method: "GET",
            })
            .then(({ data }) => {
                return extractArray(data, "organizations", (o) => {
                    return Organization.fromJson({
                        permissions: {},
                        limits: {},
                        ...assertRecord(o, "organization"),
                    });
                });
            });
    }

    /**
     * Checks if a subdomain is available and verifies its format.
     */
    getSubdomainAvailability(subdomain: string): Promise<{ status: string }> {
        assertString(subdomain, "subdomain");

        return this._apiClient
            .request(`/organization-subdomains/${encodeURIComponent(subdomain)}/availability`, {
                method: "GET",
            })
            .then(({ data }) => {
                assertInstanceOf(data, Object, "data");

                return {
                    status: extractString(data, "status"),
                };
            });
    }
    /**
     * Updates preferences of the organization.
     */
    updatePreferences({
        organizationId,
        preferences,
    }: {
        organizationId: string;
        preferences: OrganizationPreferences;
    }): Promise<undefined> {
        assertTruthy(organizationId, "organizationId");
        assertTruthy(preferences, "preferences");
        return this._apiClient
            .request(`/organizations/${encodeURIComponent(organizationId)}/preferences`, {
                method: "PATCH",
                data: preferences,
            })
            .then(() => undefined);
    }
    /**
     * Delete organization
     */
    deleteOrganization({ organizationId }: { organizationId: string }): Promise<undefined> {
        assertTruthy(organizationId, "organizationId");
        return this._apiClient
            .request(`/organizations/${encodeURIComponent(organizationId)}`, {
                method: "DELETE",
            })
            .then(() => undefined);
    }
}
