import axios from "axios";
import HttpClient from "../HttpClient";
import Response from "../Response";
import { itShouldThrowIfInvalid } from "./helpers";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const baseUrl = "https://localhost:8090";

describe("HttpClient", () => {
    describe("constructor", () => {
        it("should set `baseUrl` param as class properties", () => {
            const httpClient = new HttpClient({
                baseUrl,
            });

            expect(httpClient._baseUrl).toBe(baseUrl);
        });

        //@ts-expect-error
        itShouldThrowIfInvalid("baseUrl", () => new HttpClient({ baseUrl: null }));
    });

    describe("request", () => {
        let httpClient: HttpClient;

        beforeEach(() => {
            httpClient = new HttpClient({
                baseUrl,
            });
            mockedAxios.request.mockClear();
        });

        //@ts-expect-error
        itShouldThrowIfInvalid("url", () => httpClient.request(null, {}));

        // `url` is required to begin with a `/`
        it('should throw if `url` does not begin with a "/"', () => {
            expect(() => httpClient.request("some-url", {})).toThrowError();
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
            mockedAxios.request.mockResolvedValue(response);

            const result = await httpClient.request(url, {});

            expect(result).toEqual(expectedResponse);
        });

        it("should throw an error if rejected with no `response` object", async () => {
            const url = "/some/path";
            const data = {};
            mockedAxios.request.mockRejectedValue(new Response({ status: 404, data }));

            await expect(httpClient.request(url, {})).rejects.toThrow("Could not make the request.");
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

            await expect(httpClient.request(url, {})).rejects.toEqual(expectedResponse);
        });
    });
});
