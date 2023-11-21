import { appSlice } from "../app";

describe("appSlice", () => {
    describe("reducers", () => {
        it("doAppJoin", () => {
            const state = appSlice.reducer(
                undefined,
                appSlice.actions.doAppJoin({
                    roomName: "roomName",
                    roomKey: "roomKey",
                    displayName: "displayName",
                    sdkVersion: "sdkVersion",
                })
            );

            expect(state).toEqual({
                wantsToJoin: true,
                roomName: "roomName",
                roomKey: "roomKey",
                displayName: "displayName",
                sdkVersion: "sdkVersion",
                localMedia: null,
            });
        });

        it("doAppSetRoomKey", () => {
            const state = appSlice.reducer(undefined, appSlice.actions.doAppSetRoomKey("roomKey"));

            expect(state.roomKey).toEqual("roomKey");
        });
    });
});
