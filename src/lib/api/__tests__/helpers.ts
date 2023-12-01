// @ts-nocheck

import ApiClient from "../ApiClient";
import { Json } from "../Response";

export const itShouldThrowIfInvalid = (missingPropertyName: string, func: () => void, regexMatcher?: RegExp): void => {
    const testingNoArguments = !missingPropertyName;
    const isOrAre = missingPropertyName[missingPropertyName.length - 1] === "s" ? "are" : "is";
    const scenario = testingNoArguments ? "arguments are missing" : `${missingPropertyName} ${isOrAre} invalid`;
    const expectedException = testingNoArguments
        ? undefined
        : regexMatcher || new RegExp(`${missingPropertyName}(<[\\w|]+>)? (is|are) required`);
    it(`should throw if ${scenario}`, () => {
        expect(() => {
            func();
        }).toThrowError(expectedException);
    });
};

export const itShouldRejectIfApiClientRejects = (
    getApiClient: () => jest.Mocked<ApiClient>,
    func: () => void
): void => {
    it("should fail if the request failed", async () => {
        const error = new Error("some error");
        getApiClient().request.mockRejectedValue(error);

        await expect(func()).rejects.toThrow(error);
    });
};

export const itShouldRejectIfMultipartRequestRejects = (
    getApiClient: () => jest.Mocked<ApiClient>,
    func: () => void
) => {
    it("should fail if the requestMultipart failed", () => {
        const error = new Error("some error");
        getApiClient().requestMultipart.rejects(error);

        const promise = func();

        return expect(promise).to.eventually.be.rejected().toBe(error);
    });
};

export function toJson(value: unknown): Json {
    return JSON.parse(JSON.stringify(value));
}
