import { Credentials } from "~/lib/api";
import { deviceCredentialsSlice, doGetDeviceCredentials, shouldFetchDeviceCredentials } from "../deviceCredentials";

describe("deviceCredentialsSlice", () => {
    describe("reducers", () => {
        let credentials: Credentials;

        beforeEach(() => {
            credentials = {
                credentials: { uuid: "uuid" },
                hmac: "hmac",
                userId: "userId",
                toJson: () => "",
            };
        });

        it("doGetDeviceCredentials.pending", () => {
            const state = deviceCredentialsSlice.reducer(undefined, doGetDeviceCredentials.pending);

            expect(state).toEqual({
                data: null,
                isFetching: true,
            });
        });

        it("doGetDeviceCredentials.fulfilled", () => {
            const state = deviceCredentialsSlice.reducer(
                undefined,
                doGetDeviceCredentials.fulfilled(credentials, "", undefined)
            );

            expect(state).toEqual({
                data: credentials,
                isFetching: false,
            });
        });

        it("doGetDeviceCredentials.rejected", () => {
            const state = deviceCredentialsSlice.reducer(
                undefined,
                doGetDeviceCredentials.rejected(new Error("error"), "", undefined)
            );

            expect(state).toEqual({
                data: null,
                isFetching: true,
            });
        });
    });

    describe("reactors", () => {
        const credentials = {
            credentials: { uuid: "uuid" },
            hmac: "hmac",
            userId: "userId",
            toJson: () => "",
        };

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
                expect(shouldFetchDeviceCredentials(wantsToJoin, isFetching, deviceCredentialsData)).toBe(expected);
            }
        );
    });
});
