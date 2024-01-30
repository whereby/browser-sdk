import { appSlice } from "../app";

describe("appSlice", () => {
    describe("reducers", () => {
        it("doAppJoin", () => {
            const result = appSlice.reducer(
                undefined,
                appSlice.actions.doAppJoin({
                    roomUrl: "https://some.url/roomName",
                    roomKey: "roomKey",
                    displayName: "displayName",
                    sdkVersion: "sdkVersion",
                    externalId: "externalId",
                })
            );

            expect(result).toEqual({
                wantsToJoin: true,
                roomName: "/roomName",
                roomUrl: "https://some.url/roomName",
                roomKey: "roomKey",
                displayName: "displayName",
                sdkVersion: "sdkVersion",
                externalId: "externalId",
                isNodeSdk: true,
            });
        });

        it("setRoomKey", () => {
            const result = appSlice.reducer(undefined, appSlice.actions.setRoomKey("roomKey"));

            expect(result.roomKey).toEqual("roomKey");
        });
    });
});
