import { RootState } from "../../store";
import { initialState } from "../../../__mocks__/store";
import { shouldFetchDeviceCredentials } from "../deviceCredentials";

describe("deviceCredentialsSlice", () => {
    describe("reactors", () => {
        it.each`
            action         | wantsToJoin | data      | isFetching | expected
            ${"doAppJoin"} | ${true}     | ${null}   | ${false}   | ${true}
            ${"doAppJoin"} | ${false}    | ${null}   | ${false}   | ${false}
            ${"doAppJoin"} | ${true}     | ${"data"} | ${false}   | ${false}
            ${"doAppJoin"} | ${true}     | ${null}   | ${true}    | ${false}
            ${"doAppJoin"} | ${false}    | ${"data"} | ${true}    | ${false}
        `(
            "should return $expected when $action is called with wantsToJoin: $wantsToJoin, data: $data, isFetching: $isFetching",
            ({ action, wantsToJoin, data, isFetching, expected }) => {
                const state: RootState = {
                    ...initialState,
                    app: {
                        ...initialState.app,
                        wantsToJoin,
                    },
                    deviceCredentials: {
                        ...initialState.deviceCredentials,
                        data,
                        isFetching,
                    },
                };

                const result = shouldFetchDeviceCredentials({ type: action }, state);

                expect(result).toEqual(expected);
            }
        );
    });
});
