import { appSlice } from "../app";

describe("appSlice", () => {
    describe("reducers", () => {
        it("doAppJoin", () => {
            const state = appSlice.reducer(
                undefined,
                appSlice.actions.doAppJoin({
                    roomUrl: "https://some.url/roomName",
                    roomKey: "roomKey",
                    displayName: "displayName",
                    sdkVersion: "sdkVersion",
                })
            );

            expect(state).toEqual({
                wantsToJoin: true,
                roomName: "/roomName",
                roomUrl: "https://some.url/roomName",
                roomKey: "roomKey",
                displayName: "displayName",
                sdkVersion: "sdkVersion",
            });
        });

        it("setRoomKey", () => {
            const state = appSlice.reducer(undefined, appSlice.actions.setRoomKey("roomKey"));

            expect(state.roomKey).toEqual("roomKey");
        });
    });
});
