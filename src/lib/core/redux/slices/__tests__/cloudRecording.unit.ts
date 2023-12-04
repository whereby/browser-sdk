import { cloudRecordingSlice } from "../cloudRecording";
import { signalEvents } from "../signalConnection/actions";

describe("cloudRecordingSlice", () => {
    describe("reducers", () => {
        // We only handle error in this event. We start cloud recording when a new recorder client joins.
        it("signalEvents.cloudRecordingStarted", () => {
            const state = cloudRecordingSlice.reducer(
                undefined,
                signalEvents.cloudRecordingStarted({ error: "some error" })
            );
            expect(state).toEqual({
                error: "some error",
                isRecording: false,
                status: "error",
            });
        });

        it("signalEvents.cloudRecordingStopped", () => {
            const state = cloudRecordingSlice.reducer(undefined, signalEvents.cloudRecordingStopped());
            expect(state).toEqual({
                error: null,
                isRecording: false,
            });
        });

        it("signalEvents.newClient", () => {
            const state = cloudRecordingSlice.reducer(
                undefined,
                signalEvents.newClient({
                    client: {
                        displayName: "recorder",
                        streams: [],
                        isAudioEnabled: true,
                        isVideoEnabled: false,
                        id: "id",
                        role: {
                            roleName: "recorder",
                        },
                        startedCloudRecordingAt: "2021-01-01T00:00:00.000Z",
                    },
                })
            );
            expect(state).toEqual({
                error: null,
                isRecording: true,
                status: "recording",
                startedAt: 1609459200000,
            });
        });
    });
});
