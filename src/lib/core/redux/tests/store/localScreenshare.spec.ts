import { diff } from "deep-object-diff";
import { doStartScreenshare, doStopScreenshare } from "../../slices/localScreenshare";
import { createStore, mockRtcManager } from "../store.setup";

import MockMediaStream from "../../../../__mocks__/MediaStream";

Object.defineProperty(navigator, "mediaDevices", {
    writable: true,
    value: {
        getDisplayMedia: jest.fn(),
    },
});

const mockedGetDisplayMedia = jest.mocked(navigator.mediaDevices.getDisplayMedia);

describe("actions", () => {
    let stream: MediaStream;

    beforeEach(() => {
        stream = new MockMediaStream();
    });

    it("doStartScreenshare", async () => {
        mockedGetDisplayMedia.mockResolvedValue(stream);
        const store = createStore({
            withRtcManager: true,
        });

        const before = store.getState().localScreenshare;

        await store.dispatch(doStartScreenshare());

        const after = store.getState().localScreenshare;

        expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalled();
        expect(mockRtcManager.addNewStream).toHaveBeenCalledWith(stream.id, stream, false, true);
        expect(diff(before, after)).toEqual({
            status: "active",
            stream,
        });
    });

    it("doStopScreenshare", async () => {
        mockedGetDisplayMedia.mockResolvedValue(stream);
        const store = createStore({
            withRtcManager: true,
        });

        await store.dispatch(doStartScreenshare());

        const before = store.getState().localScreenshare;

        store.dispatch(doStopScreenshare());

        const after = store.getState().localScreenshare;

        expect(diff(before, after)).toEqual({
            status: "",
            stream: null,
        });
    });
});
