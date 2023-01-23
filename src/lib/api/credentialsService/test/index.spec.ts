// @ts-nocheck
import sinon from "sinon";
import Credentials from "../../Credentials";
import CredentialsService, { events } from "../index";
import LocalStorageStore from "../../modules/LocalStorageStore";
import DeviceService from "../../deviceService/index";

describe("CredentialsService", () => {
    let deviceService;
    let credentialsStore;
    let credentialsService;
    let storedCredentials;

    beforeEach(() => {
        credentialsStore = sinon.createStubInstance(LocalStorageStore);
        deviceService = sinon.createStubInstance(DeviceService);
        credentialsService = new CredentialsService({
            deviceService,
            credentialsStore,
        });
        storedCredentials = new Credentials("test-stored-uuid", "test-stored-hmac");
    });

    describe("getCurrentCredentials", () => {
        it("should load credentials from the store", async () => {
            credentialsStore.loadOrDefault.resolves(storedCredentials.toJson());

            const result = await credentialsService.getCurrentCredentials();

            expect(result).to.eql(storedCredentials);
        });

        // eslint-disable-next-line mocha/no-identical-title
        it("should load credentials from the store", () => {
            credentialsStore.loadOrDefault.resolves(storedCredentials.toJson());

            credentialsService.getCurrentCredentials();

            return expect(credentialsStore.loadOrDefault).to.have.been.called();
        });
    });

    describe("getCredentials", () => {
        describe("when no credentials are available in localStorage", () => {
            let apiCredentials;
            beforeEach(() => {
                apiCredentials = new Credentials("test-fetched-uuid", "test-fetched-hmac");
                credentialsStore.loadOrDefault.resolves(null);
                credentialsStore.save.resolves();
                deviceService.getCredentials.resolves(apiCredentials);
            });

            it("should save the fetched credentials to credentialsStore", () => {
                const promise = credentialsService.getCredentials();

                return promise.then(() => {
                    expect(credentialsStore.save).to.have.been.calledWithExactly(apiCredentials.toJson());
                });
            });

            it("should fetch new credentials from the API", () => {
                const promise = credentialsService.getCredentials();

                return promise.then(() => {
                    expect(deviceService.getCredentials.withArgs()).to.have.been.calledOnce();
                });
            });

            it("should resolve with the credentials from the api", async () => {
                const result = await credentialsService.getCredentials();

                return expect(result).to.eql(apiCredentials);
            });
        });

        describe("when credentials are available in localStorage", () => {
            beforeEach(() => {
                credentialsStore.loadOrDefault.resolves(storedCredentials);
                deviceService.getCredentials.resolves(null);
            });

            it("should not fetch new credentials from the api", () => {
                const promise = credentialsService.getCredentials();

                return promise.then(() => {
                    expect(deviceService.getCredentials).to.not.have.been.called();
                });
            });

            it("should return credentials from localstorage", async () => {
                const result = await credentialsService.getCredentials();

                expect(result).to.eql(storedCredentials);
            });
        });
    });

    describe("saveCredentials", () => {
        it("should save the credentials to localStorage", () => {
            credentialsStore.save.resolves();

            const promise = credentialsService.saveCredentials(storedCredentials);

            return promise.then(() => {
                expect(credentialsStore.save).to.have.been.calledWithExactly(storedCredentials.toJson());
            });
        });

        it("should fire the CREDENTIALS_SAVED event", () => {
            credentialsStore.save.resolves();
            const callback = sinon.stub();
            credentialsService.on(events.CREDENTIALS_SAVED, callback);

            const promise = credentialsService.saveCredentials(storedCredentials);

            return promise.then(() => {
                expect(callback).to.have.been.called();
            });
        });
    });

    describe("setUserId", () => {
        const mockUserId = "1234ef-987654-a1b2cd3e";

        describe("when no credentials are stored", () => {
            beforeEach(() => {
                sinon.stub(console, "error");
                credentialsStore.loadOrDefault.resolves(null);
            });

            afterEach(() => {
                console.error.restore(); // eslint-disable-line no-console
            });

            it("should call log an error", () => {
                const promise = credentialsService.setUserId(mockUserId);

                return promise.then(() => {
                    expect(console.error).to.have.been.called(); // eslint-disable-line no-console
                });
            });

            it("should return undefined", async () => {
                const result = await credentialsService.setUserId(mockUserId);

                expect(result).to.eql(undefined);
            });
        });

        describe("when have been credentials have been stored", () => {
            [null, "some-new-userId"].forEach((newUserId) => {
                let credentialsWithUserId;
                beforeEach(() => {
                    credentialsWithUserId = new Credentials("some-uuid", "some-hmac", "some-userId");
                    credentialsStore.loadOrDefault.resolves(credentialsWithUserId);
                });

                it("should return undefined", async () => {
                    const result = await credentialsService.setUserId(newUserId);

                    expect(result).to.eql(undefined);
                });

                it("should set the userId property in the credentials and store them when it has changed", () => {
                    const expectedCredentials = Object.assign({}, credentialsWithUserId, { userId: newUserId });

                    const promise = credentialsService.setUserId(newUserId);

                    return promise.then(() => {
                        expect(credentialsStore.save).to.have.been.calledWithExactly(expectedCredentials);
                    });
                });
            });
        });
    });
});
