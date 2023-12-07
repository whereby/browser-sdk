import { createStore, mockSignalEmit } from "../store.setup";
import { doStartCloudRecording, doStopCloudRecording, initialState } from "../../slices/cloudRecording";
import { diff } from "deep-object-diff";

describe("actions", () => {
    describe("doStartCloudRecording", () => {
        it("should start recording", () => {
            const store = createStore({ withSignalConnection: true });

            const before = store.getState().cloudRecording;

            store.dispatch(doStartCloudRecording());

            const after = store.getState().cloudRecording;

            expect(mockSignalEmit).toHaveBeenCalledWith("start_recording", {
                recording: "cloud",
            });
            expect(diff(before, after)).toEqual({
                status: "requested",
            });
        });

        it("should not start recording if already recording", () => {
            const store = createStore({
                withSignalConnection: true,
                initialState: {
                    cloudRecording: {
                        ...initialState,
                        isRecording: true,
                        status: "recording",
                    },
                },
            });

            store.dispatch(doStartCloudRecording());

            expect(mockSignalEmit).not.toHaveBeenCalled();
        });
    });

    it("doStopCloudRecording", () => {
        const store = createStore({
            withSignalConnection: true,
            initialState: {
                cloudRecording: {
                    ...initialState,
                    isRecording: true,
                    status: "recording",
                },
            },
        });

        store.dispatch(doStopCloudRecording());

        expect(mockSignalEmit).toHaveBeenCalledWith("stop_recording");
    });
});
