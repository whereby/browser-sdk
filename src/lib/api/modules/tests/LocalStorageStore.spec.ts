import LocalStorageStore from "../LocalStorageStore";
import { itShouldThrowIfInvalid } from "../../__tests__/helpers";
import DummyStore from "./__mocks__/storage";

jest.mock("./__mocks__/storage");

describe("LocalStorageStore", () => {
    const storeName = "myStore";
    let credentialsStore: LocalStorageStore;
    let localStorage: jest.Mocked<DummyStore>;

    beforeEach(() => {
        localStorage = new DummyStore() as jest.Mocked<DummyStore>;
        credentialsStore = new LocalStorageStore(storeName, localStorage);
    });

    afterEach(() => {
        jest.clearAllMocks();
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
            localStorage.getItem.mockImplementation((key: string) => {
                if (key === storeName) {
                    return JSON.stringify(savedValue);
                } else {
                    return null;
                }
            });

            const result = await credentialsStore.loadOrDefault({});

            expect(result).toEqual(savedValue);
        });

        it("should resolve with the default value if the stored object cannot be retrieved", async () => {
            const defaultValue = { mrT: "I pitty the fool" };
            localStorage.getItem.mockImplementation((key: string) => {
                if (key === storeName) {
                    return "This is not valid json";
                } else {
                    return null;
                }
            });

            const result = await credentialsStore.loadOrDefault(defaultValue);

            expect(result).toEqual(defaultValue);
        });

        it("should resolve with the default value if no object has been stored", async () => {
            const defaultValue = { mrT: "I pitty the fool" };
            localStorage.getItem.mockReturnValue(null);
            const result = await credentialsStore.loadOrDefault(defaultValue);
            expect(result).toEqual(defaultValue);
        });
    });

    describe("save", () => {
        it("should save the object to local storage", () => {
            const savedValue = { mrT: "I pitty the fool" };
            const expectedValue = JSON.stringify(savedValue);

            const promise = credentialsStore.save(savedValue);

            return promise.then(() => {
                expect(localStorage.setItem).toBeCalledWith(storeName, expectedValue);
            });
        });
    });
});
