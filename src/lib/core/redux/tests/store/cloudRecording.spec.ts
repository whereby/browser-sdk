import { createStore, mockSignalEmit } from "../store.setup";
import { doStartCloudRecording, doStopCloudRecording, initialState } from "../../slices/cloudRecording";
import { diff } from "deep-object-diff";

describe("actions", () => {
    it("doStartCloudRecording", () => {
        const store = createStore({ withSignalConnection: true });

        const before = store.getState().cloudRecording;

        store.dispatch(doStartCloudRecording());

        const after = store.getState().cloudRecording;

        expect(mockSignalEmit).toHaveBeenCalledWith("start_recording", {
            recording: "cloud",
        });
        expect(diff(before, after)).toEqual({
            isRecording: true,
        });
    });

    it("doStopCloudRecording", () => {
        const store = createStore({
            withSignalConnection: true,
            initialState: {
                cloudRecording: {
                    ...initialState,
                    isRecording: true,
                },
            },
        });

        const before = store.getState().cloudRecording;

        store.dispatch(doStopCloudRecording());

        const after = store.getState().cloudRecording;

        expect(mockSignalEmit).toHaveBeenCalledWith("stop_recording");
        expect(diff(before, after)).toEqual({
            isRecording: false,
        });
    });
});
