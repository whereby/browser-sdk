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
                organizationId | roomConnectionStatus | signalIdentified | localMediaStatus | isNodeSdk | expected
                ${undefined}   | ${"initializing"}    | ${x()}           | ${"started"}     | ${x()}    | ${false}
                ${"orgId"}     | ${"initializing"}    | ${true}          | ${"started"}     | ${false}  | ${true}
                ${"orgId"}     | ${"connected"}       | ${x()}           | ${"started"}     | ${x()}    | ${false}
                ${"orgId"}     | ${"initializing"}    | ${false}         | ${"starting"}    | ${x()}    | ${false}
                ${"orgId"}     | ${"initializing"}    | ${x()}           | ${"error"}       | ${false}  | ${false}
                ${"orgId"}     | ${"initializing"}    | ${true}          | ${"error"}       | ${true}   | ${true}
            `(
                "Should return $expected when organizationId=$organizationId, roomConnectionStatus=$roomConnectionStatus, signalIdentified=$signalIdentified, localMediaStatus=$localMediaStatus, isNodeSdk=$isNodeSdk",
                ({ organizationId, roomConnectionStatus, signalIdentified, localMediaStatus, isNodeSdk, expected }) => {
                    expect(
                        selectShouldConnectRoom.resultFunc(
                            organizationId,
                            roomConnectionStatus,
                            signalIdentified,
                            localMediaStatus,
                            isNodeSdk
                        )
                    ).toEqual(expected);
                }
            );
        });
    });
});
