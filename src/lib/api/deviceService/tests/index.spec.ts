import DeviceService from "../index";
import ApiClient from "../../ApiClient";
import Credentials from "../../Credentials";
import Response from "../../Response";

jest.mock("../../ApiClient");

const credentials = {
    credentials: {
        uuid: "12345",
    },
    hmac: "67890",
};

describe("deviceService", () => {
    let apiClient: jest.Mocked<ApiClient>;
    let deviceService: DeviceService;

    beforeEach(() => {
        apiClient = new ApiClient() as jest.Mocked<ApiClient>;
        deviceService = new DeviceService({ apiClient });
    });

    describe("getCredentials", () => {
        const url = "/devices";
        const method = "post";

        beforeEach(() => {
            apiClient.request.mockResolvedValue(new Response({ data: credentials }));
        });

        it("should call request with correct params", async () => {
            await deviceService.getCredentials();

            expect(apiClient.request).toBeCalledWith(url, {
                method,
            });
        });

        it("should be fulfilled with the credentials success", async () => {
            const result = await deviceService.getCredentials();

            expect(result).toEqual(new Credentials(credentials.credentials.uuid, credentials.hmac));
        });

        it("should fail if the request failed", async () => {
            const error = new Error("some error");
            apiClient.request.mockRejectedValue(error);

            await expect(deviceService.getCredentials()).rejects.toThrow(error);
        });

        it("should return null if the server is down", async () => {
            const response = { response: { status: 404 } };
            apiClient.request.mockRejectedValue(response);

            const result = await deviceService.getCredentials();

            expect(result).toEqual(null);
        });
    });
});
