import { randomDeviceCredentials } from "../../../../../lib/__mocks__/appMocks";
import { selectShouldFetchDeviceCredentials } from "../deviceCredentials";

describe("deviceCredentialsSlice", () => {
    describe("reactors", () => {
        describe("selectShouldFetchDeviceCredentials", () => {
            const credentials = randomDeviceCredentials();

            it.each`
                wantsToJoin | isFetching | deviceCredentialsData | expected
                ${true}     | ${false}   | ${undefined}          | ${true}
                ${true}     | ${false}   | ${null}               | ${true}
                ${true}     | ${false}   | ${credentials}        | ${false}
                ${true}     | ${true}    | ${undefined}          | ${false}
                ${true}     | ${true}    | ${null}               | ${false}
                ${true}     | ${true}    | ${credentials}        | ${false}
            `(
                "expected $expected when wantsToJoin=$wantsToJoin, isFetching=$isFetching, deviceCredentialsData=$deviceCredentialsData",
                ({ wantsToJoin, isFetching, deviceCredentialsData, expected }) => {
                    const deviceCredentials = {
                        isFetching,
                        data: deviceCredentialsData,
                    };

                    expect(selectShouldFetchDeviceCredentials.resultFunc(wantsToJoin, deviceCredentials)).toBe(
                        expected
                    );
                }
            );
        });
    });
});
