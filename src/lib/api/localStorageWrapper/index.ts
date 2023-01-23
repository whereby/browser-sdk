let localStorage;
try {
    localStorage = self.localStorage;
} catch (e) {
    localStorage = {
        getItem: (): undefined => undefined,
        key: (): undefined => undefined,
        setItem: (): undefined => undefined,
        removeItem: (): undefined => undefined,
        hasOwnProperty: (): undefined => undefined,
        length: 0,
    };
}

export default localStorage as Storage;
