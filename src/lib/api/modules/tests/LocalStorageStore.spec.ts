import sinon from "sinon";
import LocalStorageStore from "../LocalStorageStore";
import { itShouldThrowIfInvalid } from "../../test/helpers";
import { expect } from "chai";

class DummyStore implements Storage {
    [name: string]: unknown;
    length: number;

    constructor() {
        this.length = 0;
    }
    clear(): void {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getItem(_key: string): string | null {
        return "{}";
    }
    key(): string | null {
        throw new Error("Method not implemented.");
    }
    removeItem(): void {
        throw new Error("Method not implemented.");
    }
    setItem(): void {
        // NOP
    }
}

describe("LocalStorageStore", () => {
    const storeName = "myStore";
    let credentialsStore: LocalStorageStore;
    let localStorage: sinon.SinonStubbedInstance<DummyStore>;

    beforeEach(() => {
        localStorage = sinon.createStubInstance(DummyStore);

        credentialsStore = new LocalStorageStore(storeName, localStorage);
    });

    describe("constructor", () => {
        //@ts-expect-error
        itShouldThrowIfInvalid("key", () => new LocalStorageStore(undefined, localStorage));
        //@ts-expect-error
        itShouldThrowIfInvalid("localStorage", () => new LocalStorageStore(storeName, undefined));
    });

    describe("loadOrDefault", () => {
        it("should resolve with the stored object if available", async () => {
            const savedValue = { mrT: "I pitty the fool" };
            localStorage.getItem.withArgs(storeName).returns(JSON.stringify(savedValue));

            const result = await credentialsStore.loadOrDefault({});

            expect(result).to.eql(savedValue);
        });

        it("should resolve with the default value if the stored object cannot be retrieved", async () => {
            const defaultValue = { mrT: "I pitty the fool" };
            localStorage.getItem.withArgs(storeName).returns("This is not valid json");

            const result = await credentialsStore.loadOrDefault(defaultValue);

            expect(result).to.eql(defaultValue);
        });

        it("should resolve with the default value if no object has been stored", async () => {
            const defaultValue = { mrT: "I pitty the fool" };
            localStorage.getItem.returns(null);

            const result = await credentialsStore.loadOrDefault(defaultValue);

            expect(result).to.eql(defaultValue);
        });
    });

    describe("save", () => {
        it("should save the object to local storage", () => {
            const savedValue = { mrT: "I pitty the fool" };
            const expectedValue = JSON.stringify(savedValue);

            const promise = credentialsStore.save(savedValue);

            return promise.then(() => {
                expect(localStorage.setItem).to.have.be.calledWithExactly(storeName, expectedValue);
            });
        });
    });
});
