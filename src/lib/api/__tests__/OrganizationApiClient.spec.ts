import ApiClient from "../ApiClient";
import Response from "../Response";
import OrganizationApiClient from "../OrganizationApiClient";
import { itShouldThrowIfInvalid } from "./helpers";
import { HttpClientRequestConfig } from "../HttpClient";

jest.mock("../ApiClient");

describe("OrganizationApiClient", () => {
    let apiClient: jest.Mocked<ApiClient>;

    beforeEach(() => {
        apiClient = new ApiClient() as jest.Mocked<ApiClient>;
    });

    function testRequestMethod(requestMethodName: "request" | "requestMultipart") {
        describe(requestMethodName, () => {
            let fetchOrganization: jest.Mock;
            let organizationApiClient: OrganizationApiClient;
            let apiRequestMethod: jest.MockInstance<Promise<Response>, [url: string, options: HttpClientRequestConfig]>;
            let organizationApiRequestMethod: (url: string, config: HttpClientRequestConfig) => Promise<Response>;

            beforeEach(() => {
                fetchOrganization = jest.fn();
                organizationApiClient = new OrganizationApiClient({
                    apiClient,
                    fetchOrganization,
                });

                apiRequestMethod = apiClient[requestMethodName];

                organizationApiRequestMethod = organizationApiClient[requestMethodName].bind(organizationApiClient);
            });

            //@ts-expect-error
            itShouldThrowIfInvalid("url", () => organizationApiRequestMethod(null, {}));

            // `url` is required to begin with a `/`
            it('should throw if `url` does not begin with a "/"', () => {
                expect(() => organizationApiRequestMethod("some-url", {})).toThrowError();
            });

            it("should run `this.fetchOrganization`", () => {
                const url = "/some/path";
                const fetchOptions = {};
                fetchOrganization.mockResolvedValue(null);

                organizationApiRequestMethod(url, fetchOptions);

                expect(fetchOrganization).toBeCalledTimes(1);
            });

            describe("when no organization is returned", () => {
                beforeEach(() => {
                    fetchOrganization.mockResolvedValue(null);
                });

                it("should call the apiClient without organization prefix", () => {
                    const url = "/some/path";
                    const opts = { headers: { blah: "blah" } };
                    apiRequestMethod.mockResolvedValue(new Response());

                    const promise = organizationApiRequestMethod(url, opts);

                    return promise.then(() => {
                        expect(apiRequestMethod).toBeCalledWith(url, opts);
                    });
                });

                it("should return the response from the apiClient", async () => {
                    const url = "/some/path";
                    const options = { headers: { blah: "blah" } };
                    const response = new Response({ status: 204 });
                    apiRequestMethod.mockResolvedValue(response);

                    const result = await organizationApiRequestMethod(url, options);

                    expect(result).toEqual(response);
                });
            });

            describe("when an organization is returned", () => {
                const organizationId = 707;
                const options = { headers: { blah: "blah" } };
                beforeEach(() => {
                    fetchOrganization.mockResolvedValue({ organizationId });
                });

                it("should call the apiClient without organization prefix", () => {
                    const url = "/some/path";
                    apiRequestMethod.mockResolvedValue(new Response());

                    const promise = organizationApiRequestMethod(url, options);

                    return promise.then(() => {
                        expect(apiRequestMethod).toBeCalledWith(`/organizations/${organizationId}` + url, options);
                    });
                });

                it("should return the response from the apiClient", async () => {
                    const url = "/some/path";
                    const response = new Response({ status: 204 });
                    apiRequestMethod.mockResolvedValue(response);

                    const result = await organizationApiRequestMethod(url, options);

                    expect(result).toEqual(response);
                });
            });
        });
    }

    testRequestMethod("request");
    testRequestMethod("requestMultipart");
});
