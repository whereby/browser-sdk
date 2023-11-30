import { appSlice } from "../app";

describe("appSlice", () => {
    describe("reducers", () => {
        it("doAppJoin", () => {
            const state = appSlice.reducer(
                undefined,
                appSlice.actions.doAppJoin({
                    roomUrl: "roomUrl",
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

        it("setRoomKey", () => {
            const state = appSlice.reducer(undefined, appSlice.actions.setRoomKey("roomKey"));

            expect(state.roomKey).toEqual("roomKey");
        });
    });
});
