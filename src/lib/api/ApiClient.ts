import nodeBtoa from "btoa";
import assert from "@whereby/jslib-media/src/utils/assert";
import HttpClient, { HttpClientRequestConfig } from "./HttpClient";
import MultipartHttpClient from "./MultipartHttpClient";
import { assertString } from "./parameterAssertUtils";
import Credentials from "./Credentials";
import Response from "./Response";

let btoa: (str: string) => string;
if (typeof window === "object") {
    btoa = window.btoa || nodeBtoa;
} else if (typeof global === "object") {
    btoa = global.btoa || nodeBtoa;
} else {
    btoa = nodeBtoa;
}

/**
 * Create an object, which should be merged into the request header
 * object, which deals with the header's authorisation
 */
function _getAuthHeader(credentials: Credentials | null) {
    if (credentials && credentials.credentials) {
        const btoaStr = `${credentials.credentials.uuid}:${credentials.hmac}`;
        return { Authorization: `Basic ${btoa(btoaStr)}` };
    }
    return {};
}

interface AuthenticatedHttpClientOptions {
    httpClient: HttpClient;
    fetchDeviceCredentials: () => Promise<Credentials | null>;
}

const noCredentials: AuthenticatedHttpClientOptions["fetchDeviceCredentials"] = () => Promise.resolve(null);

class AuthenticatedHttpClient {
    private _httpClient: AuthenticatedHttpClientOptions["httpClient"];
    private _fetchDeviceCredentials: AuthenticatedHttpClientOptions["fetchDeviceCredentials"];

    constructor({ httpClient, fetchDeviceCredentials }: AuthenticatedHttpClientOptions) {
        this._httpClient = httpClient;
        this._fetchDeviceCredentials = fetchDeviceCredentials;
    }

    request(url: string, options: HttpClientRequestConfig): Promise<Response> {
        return this._fetchDeviceCredentials().then((credentials) => {
            const headers = Object.assign({}, options.headers, _getAuthHeader(credentials), {
                "X-Appearin-Device-Platform": "web",
            });

            const httpClientOptions = Object.assign({}, options, { headers });

            return this._httpClient.request(url, httpClientOptions);
        });
    }
}

interface ApiClientOptions {
    baseUrl?: string;
    fetchDeviceCredentials?: AuthenticatedHttpClientOptions["fetchDeviceCredentials"];
}
/**
 * Class used for all Whereby API calls.
 */
export default class ApiClient {
    authenticatedHttpClient: AuthenticatedHttpClient;
    authenticatedFormDataHttpClient: MultipartHttpClient;

    /**
     * Create an ApiClient instance.
     */
    constructor({
        baseUrl = "https://api.appearin.net",
        fetchDeviceCredentials = noCredentials,
    }: ApiClientOptions = {}) {
        this.authenticatedHttpClient = new AuthenticatedHttpClient({
            httpClient: new HttpClient({
                baseUrl,
            }),
            fetchDeviceCredentials,
        });

        this.authenticatedFormDataHttpClient = new MultipartHttpClient({ httpClient: this.authenticatedHttpClient });
    }

    /**
     * Wrapper for the fetch API
     */
    request(url: string, options: HttpClientRequestConfig): Promise<Response> {
        assertString(url, "url");
        assert.ok(url[0] === "/", 'url<String> only accepts relative URLs beginning with "/".');
        assert.ok(options, "options are required");

        return this.authenticatedHttpClient.request(url, options);
    }

    /**
     * Performs a multipart request where data is multipart/form-data encoded.
     */
    requestMultipart(url: string, options: HttpClientRequestConfig): Promise<Response> {
        assertString(url, "url");
        assert.ok(url[0] === "/", 'url<String> only accepts relative URLs beginning with "/".');
        assert.ok(options, "options are required");

        return this.authenticatedFormDataHttpClient.request(url, options);
    }
}
