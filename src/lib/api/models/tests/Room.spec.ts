// @ts-nocheck
import Meeting from "../Meeting";
import Room from "../Room";

const defaultRoom = {
    isClaimed: false,
    isBanned: false,
    isLocked: false,
    knockPage: {
        backgroundImageUrl: null,
        backgroundThumbnailUrl: null,
    },
    logoUrl: null,
    backgroundImageUrl: null,
    backgroundThumbnailUrl: null,
    type: null,
    legacyRoomType: null,
    mode: null,
    product: null,
    roomName: null,
    theme: null,
    preferences: {},
    protectedPreferences: {},
    publicProfile: null,
};

describe("Room", () => {
    it("should return the default room if no room is passed in", () => {
        const room = new Room();

        expect(room).toEqual(defaultRoom);
    });

    it("should return a correctly extended room object", () => {
        const extendedObj = {
            isClaimed: true,
            roomName: "/some-room-name",
        };
        const room = new Room(extendedObj);
        const expectedObj = Object.assign({}, defaultRoom, extendedObj);

        expect(room).toEqual(expectedObj);
    });

    it(
        "should return a correctly extended room object without the invalid property",
        () => {
            const room = new Room({
                isClaimed: true,
                someProperty: "someValue",
            });
            const expectedObj = Object.assign({}, defaultRoom, { isClaimed: true });

            expect(room).toEqual(expectedObj);
        }
    );

    it(
        "should return the room with the meeting if the meeting is passed in",
        () => {
            const meeting = new Meeting({
                meetingId: "123",
                startDate: new Date(),
                endDate: new Date(),
                roomName: "/some-room-name",
                roomUrl: "some-room-url",
            });

            const room = new Room({ meeting });

            expect(room).toEqual({ ...defaultRoom, meeting });
        }
    );
});
