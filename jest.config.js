export default {
    preset: "ts-jest",
    testEnvironment: "jest-environment-node",
    testMatch: ["<rootDir>/src/**/__tests__/**/*.[jt]s?(x)", "<rootDir>/src/**/?(*.)+(spec|test).[jt]s?(x)"],
    transform: {},
};
