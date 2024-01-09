import ChromeStorageStore from "../ChromeStorageStore";

describe("ChromeStorageStore", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let chromeStorage: any;
    const storeName = "myStore1";
    let credentialsStore: ChromeStorageStore;

    beforeEach(() => {
        chromeStorage = {
            get: jest.fn(() => ({})),
            set: jest.fn(),
        };

        credentialsStore = new ChromeStorageStore(storeName, chromeStorage);
    });

    describe("loadOrDefault", () => {
        it("should resolve with the stored object", async () => {
            const savedValue = { mrT: "I pitty the fool" };
            chromeStorage.get.mockImplementation((key: string, cb: (arg: { [key: string]: unknown }) => void) => {
                cb({ [storeName]: savedValue });
            });

            const result = await credentialsStore.loadOrDefault({});

            expect(result).toEqual(savedValue);
        });

        it("should resolve with the default value if a stored object cannot be retrieved", async () => {
            const defaultValue = { mrT: "I pitty the fool" };
            chromeStorage.get.mockImplementation((key: string, cb: (arg: { [key: string]: unknown }) => void) => {
                cb(defaultValue);
            });

            const result = await credentialsStore.loadOrDefault(defaultValue);

            expect(result).toEqual(defaultValue);
        });
    });

    describe("save", () => {
        it("should save the object to local storage", async () => {
            const savedValue = { mrT: "I pitty the fool" };
            chromeStorage.set.mockImplementation((obj: unknown, cb: () => void) => {
                cb();
            });

            await credentialsStore.save(savedValue);

            // The first arg of the first call to the function
            // The 2nd arg is the Promise.resolve anonymous fn
            expect(chromeStorage.set.mock.calls[0][0]).toEqual({ [storeName]: savedValue });
        });

        it("should return undefined", async () => {
            const savedValue = { mrT: "I pitty the fool" };
            chromeStorage.set.mockImplementation((obj: unknown, cb: () => void) => {
                cb();
            });

            const result = await credentialsStore.save(savedValue);

            expect(result).toBeUndefined();
        });
    });
});
