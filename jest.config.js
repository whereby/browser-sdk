module.exports = {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    testMatch: ["<rootDir>/src/**/?(*.)+(spec|test|unit).[jt]s?(x)"],
    transform: {
        "^.+\\.(j|t)sx?$": "ts-jest",
    },
    transformIgnorePatterns: ["node_modules/(?!(@whereby/jslib-media)/)"],
    roots: ["<rootDir>/src"],
};
