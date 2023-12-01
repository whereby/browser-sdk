// @ts-nocheck
import axios from "axios";
import MultipartHttpClient from "../MultipartHttpClient";
import Response from "../Response";
import HttpClient from "../HttpClient";
import { itShouldThrowIfInvalid } from "./helpers";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

class FormData {
    values: Record<string, string>;
    constructor() {
        this.values = {};
    }
    append(key, value) {
        this.values[key] = value;
    }
}

describe("MultipartHttpClient", () => {
    describe("dataToFormData", () => {
        let originalFormData;
        beforeAll(() => {
            originalFormData = global.FormData;
            global.FormData = FormData;
        });

        afterAll(() => {
            global.FormData = originalFormData;
        });

        itShouldThrowIfInvalid("data", () => {
            MultipartHttpClient.dataToFormData(null);
        });

        it("should return empty FormData if provided object is empty", () => {
            const formData = MultipartHttpClient.dataToFormData({});

            expect(formData).toEqual(new FormData());
        });

        it("should return FormData where each key and value is added", () => {
            const expectedFormData = new FormData();
            expectedFormData.append("a", "some a");
            expectedFormData.append("some other key", "some other key value");

            const formData = MultipartHttpClient.dataToFormData({
                a: "some a",
                "some other key": "some other key value",
            });

            expect(formData).toEqual(expectedFormData);
        });
    });

    describe("constructor", () => {
        itShouldThrowIfInvalid("httpClient", () => new MultipartHttpClient({ httpClient: undefined }));
    });

    describe("request", () => {
        let httpClient: HttpClient;
        let multipartHttpClient: MultipartHttpClient;
        const uri = "/api";
        const baseUrl = "https://localhost:8090";

        beforeEach(() => {
            httpClient = new HttpClient({
                baseUrl,
            });
            mockedAxios.request.mockClear();
            multipartHttpClient = new MultipartHttpClient({ httpClient });
        });

        it("should reject with the response from httpClient if rejected", async () => {
            const response = new Response({ status: 400 });
            mockedAxios.request.mockRejectedValueOnce(response);

            await expect(multipartHttpClient.request(uri, { method: "GET" })).rejects.toThrow(
                "Could not make the request."
            );
        });

        it("should resolve with the response from httpClient if resolved", async () => {
            const response = new Response({ status: 204 });
            mockedAxios.request.mockResolvedValueOnce(response);

            const result = await multipartHttpClient.request(uri, { method: "GET" });

            expect(result).toEqual(response);
        });

        it("should call httpClient with merged options object that handles form parameters", async () => {
            const data = {
                someField: "someValue",
            };
            const options = {
                method: "POST",
                data,
                headers: {
                    accept: "text/xml",
                    "Content-Type": "text/xml",
                },
            };
            const response = new Response({ status: 204 });
            mockedAxios.request.mockResolvedValueOnce(response);

            await multipartHttpClient.request(uri, options);

            expect(mockedAxios.request).toBeCalledWith({
                baseURL: baseUrl,
                method: "POST",
                data,
                headers: {
                    accept: "text/xml",
                    "Content-Type": undefined,
                },
                transformRequest: MultipartHttpClient.dataToFormData,
                url: uri,
            });
        });

        it("should call httpClient with contentType undefined even if it is provided", async () => {
            const contentType = "overridenValue";
            const response = new Response({ status: 204 });
            mockedAxios.request.mockResolvedValueOnce(response);

            await multipartHttpClient.request(uri, {
                headers: {
                    "Content-Type": contentType,
                },
            });

            expect(mockedAxios.request).toBeCalledWith({
                baseURL: baseUrl,
                headers: {
                    "Content-Type": undefined,
                },
                transformRequest: MultipartHttpClient.dataToFormData,
                url: uri,
            });
        });
    });
});
