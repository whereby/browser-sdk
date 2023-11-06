import assert from "@whereby/jslib-media/src/utils/assert";
import { HttpClientRequestConfig, IHttpClient } from "./HttpClient";
import Response from "./Response";

/**
 * ApiClient for doing multipart/form-data requests.
 */
export default class MultipartHttpClient implements IHttpClient {
    _httpClient: IHttpClient;

    constructor({ httpClient }: { httpClient: IHttpClient }) {
        assert.ok(httpClient, "httpClient is required");

        this._httpClient = httpClient;
    }

    /**
     * Convert the provided object to a FormData object containing the same keys and values.
     * @param {object} data - the data to convert.
     * @returns {FormData}
     */
    static dataToFormData(data: Record<string, string>): FormData {
        assert.ok(data, "data is required");

        const fd = new FormData();
        Object.keys(data).forEach((key) => {
            const value = data[key];
            fd.append(key, value);
        });
        return fd;
    }

    /**
     * Request a resource using multipart/form-data encoding.
     *
     * @param {string} url - the url to request
     * @param {object} options - Required. Contains the data needed for the fetch API
     * @return {Promise<Response>} - A promise which will return a Response object (https://developer.mozilla.org/en-US/docs/Web/API/Response)
     */
    request(url: string, options: HttpClientRequestConfig = {}): Promise<Response> {
        const headers = Object.assign(options.headers || {}, {
            "Content-Type": undefined,
        });

        return this._httpClient.request(
            url,
            Object.assign(options, {
                headers,
                transformRequest: MultipartHttpClient.dataToFormData,
            })
        );
    }
}
