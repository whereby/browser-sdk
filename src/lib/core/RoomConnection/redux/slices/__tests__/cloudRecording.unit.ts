import { cloudRecordingSlice } from "../cloudRecording";

describe("cloudRecordingSlice", () => {
    describe("reducers", () => {
        it("doHandleCloudRecordingStopped", () => {
            const state = cloudRecordingSlice.reducer(
                undefined,
                cloudRecordingSlice.actions.doHandleCloudRecordingStopped()
            );

            expect(state).toEqual({
                error: null,
                isRecording: false,
                startedAt: undefined,
            });
        });
    });
});
