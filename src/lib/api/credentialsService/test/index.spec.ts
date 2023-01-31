// @ts-nocheck
import ApiClient from "../../ApiClient";
import Credentials from "../../Credentials";
import CredentialsService, { events } from "../index";
import LocalStorageStore from "../../modules/LocalStorageStore";
import DeviceService from "../../deviceService/index";

jest.mock("../../modules/LocalStorageStore")
jest.mock("../../deviceService")

describe("CredentialsService", () => {
    let apiClient;
    let deviceService;
    let credentialsStore;
    let credentialsService;
    let storedCredentials;

    beforeEach(() => {
        apiClient = new ApiClient() as jest.Mocked<ApiClient>;
        credentialsStore = new LocalStorageStore;
        deviceService = new DeviceService({ apiClient });
        credentialsService = new CredentialsService({
            deviceService,
            credentialsStore,
        });
        storedCredentials = new Credentials("test-stored-uuid", "test-stored-hmac");
    });

    describe("getCurrentCredentials", () => {
        it("should load credentials from the store", async () => {
            credentialsStore.loadOrDefault.mockResolvedValue(storedCredentials.toJson());

            const result = await credentialsService.getCurrentCredentials();

            expect(result).toEqual(storedCredentials);
        });

        it("should load credentials from the store", () => {
            credentialsStore.loadOrDefault.mockResolvedValue(storedCredentials.toJson());

            credentialsService.getCurrentCredentials();

            return expect(credentialsStore.loadOrDefault).toBeCalled();
        });
    });

    describe("getCredentials", () => {
        describe("when no credentials are available in localStorage", () => {
            let apiCredentials;
            beforeEach(() => {
                apiCredentials = new Credentials("test-fetched-uuid", "test-fetched-hmac");
                credentialsStore.loadOrDefault.mockResolvedValue(null);
                credentialsStore.save.mockResolvedValue();
                deviceService.getCredentials.mockResolvedValue(apiCredentials);
            });

            it("should save the fetched credentials to credentialsStore", () => {
                const promise = credentialsService.getCredentials();

                return promise.then(() => {
                    expect(credentialsStore.save).toBeCalledWith(apiCredentials.toJson());
                });
            });

            it("should fetch new credentials from the API", async () => {
                await credentialsService.getCredentials();

                expect(deviceService.getCredentials).toBeCalledTimes(1);
            });

            it("should resolve with the credentials from the api", async () => {
                const result = await credentialsService.getCredentials();

                return expect(result).toEqual(apiCredentials);
            });
        });

        describe("when credentials are available in localStorage", () => {
            beforeEach(() => {
                credentialsStore.loadOrDefault.mockResolvedValue(storedCredentials);
                deviceService.getCredentials.mockResolvedValue(null);
            });

            it("should not fetch new credentials from the api", () => {
                const promise = credentialsService.getCredentials();

                return promise.then(() => {
                    expect(deviceService.getCredentials).not.toBeCalled();
                });
            });

            it("should return credentials from localstorage", async () => {
                const result = await credentialsService.getCredentials();

                expect(result).toEqual(storedCredentials);
            });
        });
    });

    describe("saveCredentials", () => {
        it("should save the credentials to localStorage", () => {
            credentialsStore.save.mockResolvedValue();

            const promise = credentialsService.saveCredentials(storedCredentials);

            return promise.then(() => {
                expect(credentialsStore.save).toBeCalledWith(storedCredentials.toJson());
            });
        });

        it("should fire the CREDENTIALS_SAVED event", () => {
            credentialsStore.save.mockResolvedValue();
            const callback = jest.fn();
            credentialsService.on(events.CREDENTIALS_SAVED, callback);

            const promise = credentialsService.saveCredentials(storedCredentials);

            return promise.then(() => {
                expect(callback).toBeCalled();
            });
        });
    });

    describe("setUserId", () => {
        const mockUserId = "1234ef-987654-a1b2cd3e";

        describe("when no credentials are stored", () => {
            beforeEach(() => {
                jest.spyOn(console, "error").mockClear().mockImplementation();
                credentialsStore.loadOrDefault.mockResolvedValue(null);
            });

            afterEach(() => {
                console.error.mockRestore(); // eslint-disable-line no-console
            });

            it("should call log an error", () => {
                const promise = credentialsService.setUserId(mockUserId);

                return promise.then(() => {
                    expect(console.error).toBeCalled(); // eslint-disable-line no-console
                });
            });

            it("should return undefined", async () => {
                const result = await credentialsService.setUserId(mockUserId);

                expect(result).toBeUndefined();
            });
        });

        describe("when have been credentials have been stored", () => {
            [null, "some-new-userId"].forEach((newUserId) => {
                let credentialsWithUserId;
                beforeEach(() => {
                    credentialsWithUserId = new Credentials("some-uuid", "some-hmac", "some-userId");
                    credentialsStore.loadOrDefault.mockResolvedValue(credentialsWithUserId);
                });

                it("should return undefined", async () => {
                    const result = await credentialsService.setUserId(newUserId);

                    expect(result).toBeUndefined();
                });

                it(
                    "should set the userId property in the credentials and store them when it has changed",
                    () => {
                        const expectedCredentials = Object.assign({}, credentialsWithUserId, { userId: newUserId });

                        const promise = credentialsService.setUserId(newUserId);

                        return promise.then(() => {
                            expect(credentialsStore.save).toBeCalledWith(expectedCredentials);
                        });
                    }
                );
            });
        });
    });
});
