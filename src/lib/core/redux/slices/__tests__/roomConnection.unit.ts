import { oneOf } from "../../../../../lib/__mocks__/appMocks";
import { roomConnectionSlice, selectShouldConnectRoom } from "../roomConnection";
import { signalEvents } from "../signalConnection/actions";

describe("roomConnectionSlice", () => {
    describe("reducers", () => {
        describe("signalEvents.roomJoined", () => {
            it("should set status to room_locked if the room is locked", () => {
                const result = roomConnectionSlice.reducer(
                    undefined,
                    signalEvents.roomJoined({
                        error: "room_locked",
                        selfId: "selfId",
                        isLocked: true,
                    })
                );

                expect(result).toEqual({
                    status: "room_locked",
                    session: null,
                    error: null,
                });
            });

            it("should set status to connected if the room is not locked", () => {
                const result = roomConnectionSlice.reducer(
                    undefined,
                    signalEvents.roomJoined({
                        error: "room_locked",
                        selfId: "selfId",
                        isLocked: false,
                    })
                );

                expect(result).toEqual({
                    status: "connected",
                    session: null,
                    error: null,
                });
            });
        });
    });

    describe("reactors", () => {
        describe("selectShouldConnectRoom", () => {
            const x = () => oneOf(true, false);

            it.each`
                organizationId | roomConnectionStatus | signalIdentified | localMediaStatus | expected
                ${undefined}   | ${"initializing"}    | ${x()}           | ${"started"}     | ${false}
                ${"orgId"}     | ${"initializing"}    | ${true}          | ${"started"}     | ${true}
                ${"orgId"}     | ${"connected"}       | ${x()}           | ${"started"}     | ${false}
                ${"orgId"}     | ${"initializing"}    | ${false}         | ${"starting"}    | ${false}
                ${"orgId"}     | ${"initializing"}    | ${x()}           | ${"error"}       | ${false}
            `(
                "should return $expected when hasOrganizationIdFetched=$hasOrganizationIdFetched, roomConnectionStatus=$roomConnectionStatus, signalIdentified=$signalIdentified, localMediaStatus=$localMediaStatus",
                ({ organizationId, roomConnectionStatus, signalIdentified, localMediaStatus, expected }) => {
                    expect(
                        selectShouldConnectRoom.resultFunc(
                            organizationId,
                            roomConnectionStatus,
                            signalIdentified,
                            localMediaStatus
                        )
                    ).toEqual(expected);
                }
            );
        });
    });
});
