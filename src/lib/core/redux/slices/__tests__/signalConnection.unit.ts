import { oneOf } from "../../../../../lib/__mocks__/appMocks";
import { selectShouldConnectSignal, selectShouldIdentifyDevice } from "../signalConnection";

describe("signalConnectionSlice", () => {
    describe("reactors", () => {
        describe("selectShouldConnectSignal", () => {
            const x = () => oneOf(true, false);

            it.each`
                appWantsToJoin | signalStatus   | expected
                ${true}        | ${""}          | ${true}
                ${false}       | ${""}          | ${false}
                ${x()}         | ${"connected"} | ${false}
            `(
                "should return $expected when appWantsToJoin=$appWantsToJoin, signalStatus=$signalStatus",
                ({ appWantsToJoin, signalStatus, expected }) => {
                    expect(selectShouldConnectSignal.resultFunc(appWantsToJoin, signalStatus)).toEqual(expected);
                }
            );
        });

        describe("selectShouldIdentifyDevice", () => {
            const x = () => oneOf(true, false);

            it.each`
                deviceCredentialsData | signalStatus   | deviceIdentified | isIdentifyingDevice | expected
                ${undefined}          | ${"connected"} | ${x()}           | ${x()}              | ${false}
                ${{}}                 | ${"connected"} | ${true}          | ${x()}              | ${false}
                ${{}}                 | ${"connected"} | ${false}         | ${true}             | ${false}
                ${{}}                 | ${"connected"} | ${false}         | ${false}            | ${true}
                ${undefined}          | ${""}          | ${x()}           | ${x()}              | ${false}
                ${{}}                 | ${""}          | ${true}          | ${x()}              | ${false}
                ${{}}                 | ${""}          | ${false}         | ${true}             | ${false}
                ${{}}                 | ${""}          | ${false}         | ${false}            | ${false}
            `(
                "should return $expected when deviceCredentialsData=$deviceCredentialsData, signalStatus=$signalStatus, deviceIdentified=$deviceIdentified, isIdentifyingDevice=$isIdentifyingDevice",
                ({ deviceCredentialsData, signalStatus, deviceIdentified, isIdentifyingDevice, expected }) => {
                    const deviceCredentialsRaw = {
                        isFetching: false,
                        data: deviceCredentialsData,
                    };

                    expect(
                        selectShouldIdentifyDevice.resultFunc(
                            deviceCredentialsRaw,
                            signalStatus,
                            deviceIdentified,
                            isIdentifyingDevice
                        )
                    ).toEqual(expected);
                }
            );
        });
    });
});
