import { selectShouldFetchOrganization } from "../organization";
import { oneOf, randomOrganization } from "../../../../__mocks__/appMocks";

describe("deviceCredentialsSlice", () => {
    describe("reactors", () => {
        describe("selectShouldFetchOrganization", () => {
            const organization = randomOrganization();
            const x = () => oneOf(true, false);

            it.each`
                wantsToJoin | organizationData | isFetchingOrganization | organizationError | isFetchingDeviceCredentials | expected
                ${true}     | ${undefined}     | ${false}               | ${false}          | ${false}                    | ${true}
                ${true}     | ${null}          | ${false}               | ${false}          | ${false}                    | ${true}
                ${x()}      | ${organization}  | ${x()}                 | ${x()}            | ${x()}                      | ${false}
                ${x()}      | ${organization}  | ${true}                | ${x()}            | ${x()}                      | ${false}
                ${x()}      | ${organization}  | ${x()}                 | ${true}           | ${x()}                      | ${false}
                ${x()}      | ${organization}  | ${x()}                 | ${x()}            | ${true}                     | ${false}
            `(
                "should return $expected when wantsToJoin=$wantsToJoin, organizationData=$organizationData, isFetchingOrganization=$isFetchingOrganization, organizationError=$organizationError, isFetchingDeviceCredentials=$isFetchingDeviceCredentials",
                ({
                    wantsToJoin,
                    organizationData,
                    isFetchingOrganization,
                    organizationError,
                    isFetchingDeviceCredentials,
                    expected,
                }) => {
                    const organizationRaw = {
                        data: organizationData,
                        isFetching: isFetchingOrganization,
                        error: organizationError,
                    };
                    const deviceCredentialsRaw = {
                        isFetching: isFetchingDeviceCredentials,
                    };

                    expect(
                        selectShouldFetchOrganization.resultFunc(wantsToJoin, organizationRaw, deviceCredentialsRaw)
                    ).toEqual(expected);
                }
            );
        });
    });
});
