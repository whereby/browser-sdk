import axios from "axios";
import ApiClient from "../ApiClient";
import Credentials from "../Credentials";
import Response from "../Response";
import { itShouldThrowIfInvalid } from "./helpers";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const baseUrl = "https://localhost:8090";
const credentials = new Credentials("12345", "67890");

describe("ApiClient", () => {
    describe("constructor", () => {
        it("should not throw an error if no constructor params are passed through", () => {
            expect(() => new ApiClient()).not.toThrowError();
        });
    });

    describe("request", () => {
        let fetchDeviceCredentialsMock: jest.Mock;
        let apiClient: ApiClient;

        beforeEach(() => {
            mockedAxios.request.mockResolvedValue(new Response());
            fetchDeviceCredentialsMock = jest.fn().mockResolvedValueOnce(credentials);
            apiClient = new ApiClient({
                baseUrl,
                fetchDeviceCredentials: fetchDeviceCredentialsMock,
            });
        });

        afterEach(() => {
            mockedAxios.request.mockClear();
        });

        //@ts-expect-error
        itShouldThrowIfInvalid("url", () => apiClient.request(null, {}));

        // `url` is required to begin with a `/`
        it('should throw if `url` does not begin with a "/"', () => {
            expect(() => apiClient.request("some-url", {})).toThrowError();
        });

        it("should run `this.fetchDeviceCredentials`", () => {
            const url = "/some/path";
            const fetchOptions = {};

            apiClient.request(url, fetchOptions);

            expect(fetchDeviceCredentialsMock).toBeCalledTimes(1);
        });

        it("should return the correct Response value with the correct data if fulfilled", async () => {
            const responseBaseUrl = "www.website.com";
            const url = "/some/path";
            const method = "post";
            const headers = {
                type: "jif",
            };
            const data = { some: "data" };
            const status = 200;
            const statusText = "some status text";
            const response = {
                data,
                headers,
                method,
                status,
                statusText,
                config: {
                    url,
                    baseURL: responseBaseUrl,
                },
            };
            const expectedResponse = new Response({
                data,
                headers,
                status: response.status,
                statusText: response.statusText,
                url: `${responseBaseUrl}${url}`,
            });
            mockedAxios.request.mockResolvedValueOnce(response);

            const result = await apiClient.request(url, {});

            expect(result).toEqual(expectedResponse);
        });

        it("should throw an error if rejected with no `response` object", async () => {
            const url = "/some/path";
            const data = {};
            mockedAxios.request.mockRejectedValue(new Response({ status: 404, data }));

            await expect(apiClient.request(url, {})).rejects.toThrow("Could not make the request.");
        });

        it("should return the correct Response value with the correct data if rejected", async () => {
            const responseBaseUrl = "www.website.com";
            const url = "/some/path";
            const method = "post";
            const headers = {
                type: "jif",
            };
            const data = { some: "data" };
            const status = 200;
            const statusText = "some status text";
            const response = {
                data,
                headers,
                method,
                status,
                statusText,
                config: {
                    url,
                    baseURL: responseBaseUrl,
                },
            };
            const expectedResponse = new Response({
                data,
                headers,
                status: response.status,
                statusText: response.statusText,
                url: `${responseBaseUrl}${url}`,
            });
            mockedAxios.request.mockRejectedValue({ response });

            await expect(apiClient.request(url, {})).rejects.toEqual(expectedResponse);
        });
    });
});
