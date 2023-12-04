import { createStore, mockSignalEmit } from "../store.setup";
import { doStartCloudRecording, doStopCloudRecording } from "../../slices/cloudRecording";

describe("doStartCloudRecording", () => {
    it("should emit start_cloud_recording", () => {
        const store = createStore({ withSignalConnection: true });

        store.dispatch(doStartCloudRecording());

        expect(mockSignalEmit).toHaveBeenCalledWith("start_recording", {
            recording: "cloud",
        });
    });
});

describe("doStopCloudRecording", () => {
    it("should emit stop_recording", () => {
        const store = createStore({ withSignalConnection: true });

        store.dispatch(doStopCloudRecording());

        expect(mockSignalEmit).toHaveBeenCalledWith("stop_recording");
    });
});
