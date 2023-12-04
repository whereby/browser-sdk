import { randomDeviceCredentials } from "../../../../../lib/__mocks__/appMocks";
import { Credentials } from "../../../../../lib/api";
import {
    deviceCredentialsSlice,
    doGetDeviceCredentials,
    selectShouldFetchDeviceCredentials,
} from "../deviceCredentials";

describe("deviceCredentialsSlice", () => {
    describe("reducers", () => {
        let credentials: Credentials;

        beforeEach(() => {
            credentials = randomDeviceCredentials();
        });

        it("doGetDeviceCredentials.pending", () => {
            const result = deviceCredentialsSlice.reducer(undefined, doGetDeviceCredentials.pending);

            expect(result).toEqual({
                data: null,
                isFetching: true,
            });
        });

        it("doGetDeviceCredentials.fulfilled", () => {
            const result = deviceCredentialsSlice.reducer(
                undefined,
                doGetDeviceCredentials.fulfilled(credentials, "", undefined)
            );

            expect(result).toEqual({
                data: credentials,
                isFetching: false,
            });
        });

        it("doGetDeviceCredentials.rejected", () => {
            const result = deviceCredentialsSlice.reducer(
                undefined,
                doGetDeviceCredentials.rejected(new Error("error"), "", undefined)
            );

            expect(result).toEqual({
                data: null,
                isFetching: true,
            });
        });
    });

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
