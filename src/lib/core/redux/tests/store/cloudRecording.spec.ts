import { createStore, mockSignalEmit } from "../store.setup";
import {
    doStartCloudRecording,
    doStopCloudRecording,
    // doHandleCloudRecordingStarted,
    // doHandleRecorderClientJoined,
} from "../../slices/cloudRecording";

describe("doStartCloudRecording", () => {
    it("should emit start_cloud_recording", async () => {
        const store = createStore({ withSignalConnection: true });

        await store.dispatch(doStartCloudRecording());

        expect(mockSignalEmit).toHaveBeenCalledWith("start_recording", {
            recording: "cloud",
        });
    });
});

describe("doStopCloudRecording", () => {
    it("should emit stop_recording", async () => {
        const store = createStore({ withSignalConnection: true });

        await store.dispatch(doStopCloudRecording());

        expect(mockSignalEmit).toHaveBeenCalledWith("stop_recording");
    });
});

describe("doHandleCloudRecordingStarted", () => {
    // it("should return error", async () => {
    //     const store = createStore();
    //     await store.dispatch(
    //         doHandleCloudRecordingStarted({
    //             error: "error",
    //         })
    //     );
    //     expect(store.getState().cloudRecording.error).toBe("error");
    // });
});

describe("doHandleRecorderClientJoined", () => {
    // it("should set startedAt", async () => {
    //     const store = createStore();
    //     await store.dispatch(
    //         doHandleRecorderClientJoined({
    //             client: {
    //                 displayName: "displayName",
    //                 streams: [],
    //                 isAudioEnabled: true,
    //                 isVideoEnabled: true,
    //                 role: { roleName: "recorder" },
    //                 id: "id",
    //                 startedCloudRecordingAt: "2021-01-01T00:00:00.000Z",
    //             },
    //         })
    //     );
    //     expect(store.getState().cloudRecording.startedAt).toBe(new Date("2021-01-01T00:00:00.000Z").getTime());
    // });
});
