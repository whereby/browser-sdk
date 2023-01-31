import ApiClient from "./ApiClient";
import assert from "assert";
import { assertInstanceOf, assertString } from "./parameterAssertUtils";
import { HttpClientRequestConfig } from "./HttpClient";
import Response from "./Response";
import Organization from "./models/Organization";

const noOrganization = () => Promise.resolve(undefined);

export type FetchOrganizationFunction = () => Promise<Organization | undefined>;

/**
 * Class used for all Whereby organization API calls.
 */
export default class OrganizationApiClient {
    private _apiClient: ApiClient;
    private _fetchOrganization: FetchOrganizationFunction;
    /**
     * Create an OrganizationApiClient instance.
     *
     * @param {ApiClient} [apiClient] - The apiClient to use.
     * @param {Function} [fetchOrganization] - function that returns a promise with the organization.
     */
    constructor({
        apiClient,
        fetchOrganization = noOrganization,
    }: {
        apiClient: ApiClient;
        fetchOrganization?: FetchOrganizationFunction;
    }) {
        this._apiClient = assertInstanceOf(apiClient, ApiClient);
        assert.ok(typeof fetchOrganization === "function", "fetchOrganization<Function> is required");

        this._fetchOrganization = fetchOrganization;
        this._apiClient = apiClient;
    }

    _callRequestMethod(
        method: "request" | "requestMultipart",
        url: string,
        options: HttpClientRequestConfig
    ): Promise<Response> {
        assertString(url, "url");
        assert.equal(url[0], "/", 'url<String> only accepts relative URLs beginning with "/".');
        assert.ok(options, "options are required");
        return this._fetchOrganization().then((organization) => {
            if (!organization) {
                return this._apiClient[method](url, options);
            }

            const { organizationId } = organization;

            return this._apiClient[method](`/organizations/${encodeURIComponent(organizationId)}${url}`, options);
        });
    }

    request(url: string, options: HttpClientRequestConfig): Promise<Response> {
        return this._callRequestMethod("request", url, options);
    }

    requestMultipart(url: string, options: HttpClientRequestConfig): Promise<Response> {
        return this._callRequestMethod("requestMultipart", url, options);
    }
}
