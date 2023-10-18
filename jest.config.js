module.exports = {
    preset: "ts-jest",
    testEnvironment: "jsdom",
    testMatch: ["<rootDir>/src/**/__tests__/**/*.[jt]s?(x)", "<rootDir>/src/**/?(*.)+(spec|test).[jt]s?(x)"],
    transform: {
        "^.+\\.(j|t)sx?$": "ts-jest",
    },
    transformIgnorePatterns: ["node_modules/(?!(@whereby/jslib-media)/)"],
};
