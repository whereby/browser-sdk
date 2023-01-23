import sinon from "sinon";
import ChromeStorageStore from "../ChromeStorageStore";
import { expect } from "chai";

describe("ChromeStorageStore", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let chromeStorage: any;
    const storeName = "myStore1";
    let credentialsStore: ChromeStorageStore;

    beforeEach(() => {
        chromeStorage = sinon.stub({
            get() {
                return {};
            },

            set() {
                // Do nothing
            },
        });

        credentialsStore = new ChromeStorageStore(storeName, chromeStorage);
    });

    describe("loadOrDefault", () => {
        it("should resolve with the stored object", async () => {
            const savedValue = { mrT: "I pitty the fool" };
            chromeStorage.get.withArgs(storeName).callsArgWith(1, { [storeName]: savedValue });

            const result = await credentialsStore.loadOrDefault({});

            expect(result).to.eql(savedValue);
        });

        it("should resolve with the default value if a stored object cannot be retrieved", async () => {
            const defaultValue = { mrT: "I pitty the fool" };
            chromeStorage.get.withArgs(storeName).callsArgWith(1, {});

            const result = await credentialsStore.loadOrDefault(defaultValue);

            expect(result).to.eql(defaultValue);
        });

        it("should resolve with the default value if no object has been stored", async () => {
            const defaultValue = { mrT: "I pitty the fool" };
            chromeStorage.get.withArgs(storeName).callsArgWith(1, {});

            const result = await credentialsStore.loadOrDefault(defaultValue);

            expect(result).to.eql(defaultValue);
        });
    });

    describe("save", () => {
        it("should save the object to local storage", () => {
            const savedValue = { mrT: "I pitty the fool" };
            chromeStorage.set.withArgs({ [storeName]: savedValue }).callsArgWith(1, null);

            const promise = credentialsStore.save(savedValue);

            return promise.then(() => {
                expect(chromeStorage.set).to.have.be.calledWith({ [storeName]: savedValue });
            });
        });

        it("should return undefined", async () => {
            const savedValue = { mrT: "I pitty the fool" };
            chromeStorage.set.withArgs({ [storeName]: savedValue }).callsArgWith(1, null);

            const result = await credentialsStore.save(savedValue);

            expect(result).to.eql(undefined);
        });
    });
});
