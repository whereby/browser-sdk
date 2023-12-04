import { cloudRecordingSlice } from "../cloudRecording";
import { signalEvents } from "../signalConnection/actions";

describe("cloudRecordingSlice", () => {
    describe("reducers", () => {
        // We only handle error in this event. We start cloud recording when a new recorder client joins.
        it("signalEvents.cloudRecordingStarted", () => {
            const result = cloudRecordingSlice.reducer(
                undefined,
                signalEvents.cloudRecordingStarted({ error: "some error" })
            );

            expect(result).toEqual({
                error: "some error",
                isRecording: false,
                status: "error",
            });
        });

        it("signalEvents.cloudRecordingStopped", () => {
            const result = cloudRecordingSlice.reducer(undefined, signalEvents.cloudRecordingStopped());

            expect(result).toEqual({
                error: null,
                isRecording: false,
            });
        });

        it("signalEvents.newClient", () => {
            const result = cloudRecordingSlice.reducer(
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

            expect(result).toEqual({
                error: null,
                isRecording: true,
                status: "recording",
                startedAt: 1609459200000,
            });
        });
    });
});
