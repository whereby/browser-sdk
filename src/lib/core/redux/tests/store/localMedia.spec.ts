import { doStartLocalMedia, doStopLocalMedia } from "../../slices/localMedia";
import { createStore } from "../store.setup";
import { diff } from "deep-object-diff";
import { getStream } from "@whereby/jslib-media/src/webrtc/MediaDevices";

import MockMediaStream from "../../../../__mocks__/MediaStream";
import MockMediaStreamTrack from "../../../../__mocks__/MediaStreamTrack";
import mockMediaDevices from "../../../../__mocks__/mediaDevices";
import { RootState } from "../../store";

Object.defineProperty(window, "MediaStream", {
    writable: true,
    value: MockMediaStream,
});

Object.defineProperty(window, "MediaStreamTrack", {
    writable: true,
    value: MockMediaStreamTrack,
});

Object.defineProperty(navigator, "mediaDevices", {
    writable: true,
    value: mockMediaDevices,
});

jest.mock("@whereby/jslib-media/src/webrtc/MediaDevices", () => ({
    __esModule: true,
    getStream: jest.fn(() => Promise.resolve()),
}));

const mockedGetStream = jest.mocked(getStream);

describe("actions", () => {
    describe("doStartLocalMedia", () => {
        describe("when passed existing stream", () => {
            let existingStream: MediaStream;

            beforeEach(() => {
                existingStream = new MockMediaStream();
            });

            it("should NOT get stream", async () => {
                const store = createStore();

                await store.dispatch(doStartLocalMedia(existingStream));

                expect(mockedGetStream).toHaveBeenCalledTimes(0);
            });

            it("shuold resolve with existing stream", async () => {
                const store = createStore();

                const before = store.getState().localMedia;

                await store.dispatch(doStartLocalMedia(existingStream));

                const after = store.getState().localMedia;

                expect(diff(before, after)).toEqual({ status: "started", stream: existingStream });
            });
        });

        describe("when passed localMediaOptions", () => {
            it("should call getStream", async () => {
                const store = createStore();

                await store.dispatch(doStartLocalMedia({ audio: true, video: true }));

                expect(mockedGetStream).toHaveBeenCalledTimes(1);
            });

            describe("when getStream succeeeds", () => {
                let newStream: MediaStream;

                beforeEach(() => {
                    newStream = new MockMediaStream();
                    mockedGetStream.mockResolvedValueOnce({ stream: newStream });
                });

                it("should update state", async () => {
                    const store = createStore();

                    const before = store.getState().localMedia;

                    await store.dispatch(doStartLocalMedia({ audio: true, video: true }));

                    const after = store.getState().localMedia;

                    expect(diff(before, after)).toEqual({
                        status: "started",
                        stream: newStream,
                        devices: expect.any(Object),
                        options: { audio: true, video: true },
                    });
                });
            });
        });
    });

    describe("doStopLocalMedia", () => {
        describe("when existing stream", () => {
            let audioTrack: MediaStreamTrack;
            let videoTrack: MediaStreamTrack;
            let initialState: Partial<RootState>;

            beforeEach(() => {
                audioTrack = new MockMediaStreamTrack("audio");
                videoTrack = new MockMediaStreamTrack("video");

                initialState = {
                    localMedia: {
                        cameraEnabled: true,
                        devices: [],
                        isSettingCameraDevice: false,
                        isSettingMicrophoneDevice: false,
                        isTogglingCamera: false,
                        microphoneEnabled: true,
                        status: "started",
                        stream: new MockMediaStream([audioTrack, videoTrack]),
                        isSwitchingStream: false,
                    },
                };
            });

            it("should stop all tracks in existing stream", () => {
                const store = createStore({ initialState });

                store.dispatch(doStopLocalMedia());

                expect(audioTrack.stop).toHaveBeenCalled();
                expect(videoTrack.stop).toHaveBeenCalled();
            });

            it('should update state to "stopped"', () => {
                const store = createStore({ initialState });

                const before = store.getState().localMedia;

                store.dispatch(doStopLocalMedia());

                const after = store.getState().localMedia;

                expect(diff(before, after)).toEqual({
                    status: "stopped",
                    stream: undefined,
                });
            });
        });
    });
});
