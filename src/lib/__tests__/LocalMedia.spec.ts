import { jest } from "@jest/globals";

import LocalMedia from "../LocalMedia";
import MockRtcManager from "../__mocks__/RtcManager";
import MockMediaStream from "../__mocks__/MediaStream";
import MockMediaStreamTrack from "../__mocks__/MediaStreamTrack";
import mockMediaDevices from "../__mocks__/mediaDevices";

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

const mockedMediaDevices = jest.mocked(navigator.mediaDevices);

describe("LocalMedia", () => {
    describe("instance", () => {
        let localMedia: LocalMedia;
        let mediaConstraints: MediaStreamConstraints;

        beforeEach(() => {
            mediaConstraints = { audio: true, video: true };
            localMedia = new LocalMedia(mediaConstraints);
        });

        describe("addRtcManager()", () => {
            it("should add the supplied manager to its list of managers", () => {
                const rtcManager = new MockRtcManager();

                localMedia.addRtcManager(rtcManager);

                expect(localMedia._rtcManagers).toEqual([rtcManager]);
            });
        });

        describe("removeRtcManager()", () => {
            it("should remove the supplied manager from its list of managers", () => {
                const rtcManager = new MockRtcManager();

                localMedia.addRtcManager(rtcManager);
                localMedia.removeRtcManager(rtcManager);

                expect(localMedia._rtcManagers).toEqual([]);
            });
        });

        describe("setMicrophoneDevice", () => {
            let deviceId: string;

            beforeEach(() => {
                deviceId = "<some_device_id>";
            });

            it("should get user media with given audio device id", () => {
                const localMedia = new LocalMedia({ audio: true });

                localMedia.setMicrophoneDevice(deviceId);

                expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
                    audio: { deviceId },
                });
            });

            describe("when getting new audio track succeeeds", () => {
                let newAudioTrack: MediaStreamTrack;

                beforeEach(() => {
                    newAudioTrack = new MockMediaStreamTrack("audio");
                    mockedMediaDevices.getUserMedia.mockResolvedValueOnce(new MediaStream([newAudioTrack]));
                });

                it("should emit 'stream_updated' with new track", async () => {
                    const localMedia = new LocalMedia({ audio: true });
                    const handler = jest.fn();
                    localMedia.addEventListener("stream_updated", handler);

                    await localMedia.setMicrophoneDevice(deviceId);

                    expect(handler).toHaveBeenCalled();
                });
            });
        });

        describe("start()", () => {
            it("should call getUserMedia with supplied constraints", () => {
                const mediaConstraints = { audio: false, video: true };
                const localMedia = new LocalMedia(mediaConstraints);

                localMedia.start();

                expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(mediaConstraints);
            });

            describe("when getUserMedia succeeds", () => {
                it("should return a stream with tracks", async () => {
                    const audioTrack = new MediaStreamTrack();
                    const videoTrack = new MediaStreamTrack();
                    mockedMediaDevices.getUserMedia.mockResolvedValueOnce(new MediaStream([audioTrack, videoTrack]));

                    const stream = await localMedia.start();

                    expect(!!stream.getTracks().find((t) => t === audioTrack)).toEqual(true);
                    expect(!!stream.getTracks().find((t) => t === videoTrack)).toEqual(true);
                });

                it("should dispatch 'stream_updated' containing stream with tracks", async () => {
                    const audioTrack = new MediaStreamTrack();
                    const videoTrack = new MediaStreamTrack();
                    mockedMediaDevices.getUserMedia.mockResolvedValueOnce(new MediaStream([audioTrack, videoTrack]));
                    const eventHandler = jest.fn();
                    localMedia.addEventListener("stream_updated", eventHandler);

                    await localMedia.start();

                    expect(eventHandler).toHaveBeenCalled();
                });
            });
        });

        describe("stop()", () => {
            it("should stop all tracks", async () => {
                const audioTrack = new MediaStreamTrack();
                const videoTrack = new MediaStreamTrack();
                mockedMediaDevices.getUserMedia.mockResolvedValueOnce(new MediaStream([audioTrack, videoTrack]));

                await localMedia.start();
                localMedia.stop();

                expect(audioTrack.stop).toHaveBeenCalled();
                expect(videoTrack.stop).toHaveBeenCalled();
            });
        });
    });
});
