import assert from "@whereby/jslib-media/src/utils/assert";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import Response, { ErrorResponseObject } from "./Response";
import { assertString } from "./parameterAssertUtils";

export type HttpClientRequestConfig = AxiosRequestConfig | { [key: string]: unknown };

export interface IHttpClient {
    request(url: string, options: HttpClientRequestConfig): Promise<Response>;
}

function _getAbsoluteUrl({ baseUrl, url }: { baseUrl?: string; url: string }): string {
    return baseUrl ? baseUrl + url : url;
}

/**
 * Class used for making http calls. This is just a pure
 * wrapper around the http lib that we decide to use,
 * so that we can switch implementations.
 */
export default class HttpClient implements IHttpClient {
    _baseUrl: string;
    /**
     * Creates an HttpClient instance.
     *
     * @param {string} [baseUrl] - The base URL where all requests are made.
     */
    constructor({ baseUrl }: { baseUrl: string }) {
        assertString(baseUrl, "baseUrl");

        this._baseUrl = baseUrl;
    }

    private _requestAxios(url: string, options: HttpClientRequestConfig): Promise<AxiosResponse> {
        const axiosOptions = Object.assign({}, options, {
            url,
            baseURL: this._baseUrl,
        });

        return axios.request(axiosOptions);
    }

    /**
     * Wrapper for the axios API
     *
     * @param {string} url - Required. URL (appended to base URL) where API call will be made
     * @param {object} options - Required. Contains the data needed for the fetch API
     * @return {Promise<Response>} - A promise which will return a Response object (https://developer.mozilla.org/en-US/docs/Web/API/Response)
     */
    request(url: string, options: HttpClientRequestConfig): Promise<Response> {
        assertString(url, "url");
        assert.ok(url[0] === "/", 'url<String> only accepts relative URLs beginning with "/".');
        assert.ok(options, "options are required");

        return this._requestAxios(url, options)
            .then((response) => {
                const { data, headers, status, statusText, config } = response;
                const requestUrl =
                    config && config.url ? _getAbsoluteUrl({ baseUrl: config.baseURL, url: config.url }) : null;

                return new Response({
                    data,
                    headers,
                    status,
                    statusText,
                    url: requestUrl,
                });
            })
            .catch((error: AxiosError) => {
                const responseObject = error.response;

                if (!responseObject) {
                    // Either server error or something else.
                    throw new Error("Could not make the request.");
                }

                const { data, headers, status, statusText, config } = responseObject as ErrorResponseObject;
                const requestUrl =
                    config && config.url ? _getAbsoluteUrl({ baseUrl: config.baseURL, url: config.url }) : null;

                return Promise.reject(
                    new Response({
                        data,
                        headers,
                        status,
                        statusText,
                        url: requestUrl,
                    })
                );
            });
    }
}
