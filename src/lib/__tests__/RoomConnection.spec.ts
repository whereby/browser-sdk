import { jest } from "@jest/globals";

import RoomConnection from "../RoomConnection";

jest.mock("@whereby/jslib-media/src/utils/ServerSocket");
jest.mock("../LocalMedia");

describe("RoomConnection", () => {
    describe("constructor", () => {
        it("should set room key when part of url", () => {
            const roomKey = "abc";

            const roomConnection = new RoomConnection(`https://subdomain.whereby.com/<some-room>?roomKey=${roomKey}`, {
                localMediaConstraints: { audio: true, video: true },
            });

            expect(roomConnection.roomKey).toEqual(roomKey);
        });

        it("should prefer room key passed directly in options", () => {
            const roomKey = "abc";

            const roomConnection = new RoomConnection(`https://subdomain.whereby.com/<some-room>?roomKey=urlKey`, {
                localMediaConstraints: { audio: true, video: true },
                roomKey,
            });

            expect(roomConnection.roomKey).toEqual(roomKey);
        });
    });
});
