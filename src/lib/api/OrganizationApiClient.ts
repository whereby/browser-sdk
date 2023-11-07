import assert from "@whereby/jslib-media/src/utils/assert";
import ApiClient from "./ApiClient";
import { assertString } from "./parameterAssertUtils";
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
     * @param {Object} options - The options for the OrganizationApiClient.
     * @param {ApiClient} [options.apiClient] - The apiClient to use.
     * @param {Function} [options.fetchOrganization] - function that returns a promise with the organization.
     */
    constructor({
        apiClient,
        fetchOrganization = noOrganization,
    }: {
        apiClient: ApiClient;
        fetchOrganization?: FetchOrganizationFunction;
    }) {
        this._apiClient = apiClient;
        this._fetchOrganization = fetchOrganization;
        this._apiClient = apiClient;
    }

    _callRequestMethod(
        method: "request" | "requestMultipart",
        url: string,
        options: HttpClientRequestConfig
    ): Promise<Response> {
        assertString(url, "url");
        assert.ok(url[0] === "/", 'url<String> only accepts relative URLs beginning with "/".');
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
