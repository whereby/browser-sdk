import sinon from "sinon";
import DeviceService from "../index";
import ApiClient from "../../ApiClient";
import Credentials from "../../Credentials";
import { itShouldThrowIfInvalid } from "../../test/helpers";
import { expect } from "chai";
import Response from "../../Response";

const credentials = {
    credentials: {
        uuid: "12345",
    },
    hmac: "67890",
};

describe("deviceService", () => {
    let apiClient: sinon.SinonStubbedInstance<ApiClient>;
    let deviceService: DeviceService;

    beforeEach(() => {
        apiClient = sinon.createStubInstance(ApiClient);
        deviceService = new DeviceService({ apiClient });
    });

    describe("constructor", () => {
        itShouldThrowIfInvalid(
            "apiClient",
            () =>
                new DeviceService({
                    //@ts-expect-error
                    apiClient: undefined,
                })
        );
    });

    describe("getCredentials", () => {
        const url = "/devices";
        const method = "post";

        beforeEach(() => {
            apiClient.request.resolves(new Response({ data: credentials }));
        });

        it("should call request with correct params", () => {
            return deviceService.getCredentials().then(() => {
                expect(apiClient.request).has.been.calledWithExactly(url, {
                    method,
                });
            });
        });

        it("should be fulfilled with the credentials success", async () => {
            const result = await deviceService.getCredentials();

            expect(result).to.eql(new Credentials(credentials.credentials.uuid, credentials.hmac));
        });

        it("should fail if the request failed", () => {
            const error = new Error("some error");
            apiClient.request.rejects(error);

            return expect(deviceService.getCredentials()).to.eventually.be.rejected().and.be.equal(error);
        });

        it("should return null if the server is down", async () => {
            const response = { response: { status: 404 } };
            apiClient.request.rejects(response);

            const result = await deviceService.getCredentials();

            expect(result).to.eql(null);
        });
    });
});
