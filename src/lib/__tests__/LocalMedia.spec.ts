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
    describe("constructor", () => {
        describe("when passing constraints", () => {
            it("`isCameraEnabled` should be false", () => {
                const localMedia = new LocalMedia({ audio: true, video: true });

                expect(localMedia.isCameraEnabled()).toEqual(false);
            });

            it("`isMicrophoneEnabled should be false`", () => {
                const localMedia = new LocalMedia({ audio: true, video: true });

                expect(localMedia.isMicrophoneEnabled()).toEqual(false);
            });
        });

        describe("when passing an existing stream with enabled tracks", () => {
            let localMedia: LocalMedia;

            beforeEach(() => {
                const mediaStream = new MockMediaStream([
                    new MockMediaStreamTrack("audio"),
                    new MockMediaStreamTrack("video"),
                ]);
                localMedia = new LocalMedia(mediaStream);
            });

            it("`isCameraEnabled` should be true", () => {
                expect(localMedia.isCameraEnabled()).toEqual(true);
            });

            it("`isMicrophoneEnabled` should be true", () => {
                expect(localMedia.isMicrophoneEnabled()).toEqual(true);
            });
        });
    });

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
                let audioTrack: MediaStreamTrack;
                let videoTrack: MediaStreamTrack;

                beforeEach(() => {
                    audioTrack = new MockMediaStreamTrack("audio");
                    videoTrack = new MockMediaStreamTrack("video");
                    mockedMediaDevices.getUserMedia.mockResolvedValueOnce(new MediaStream([audioTrack, videoTrack]));
                });

                it("should return a stream with tracks", async () => {
                    const stream = await localMedia.start();

                    expect(stream.getAudioTracks()[0]).toEqual(audioTrack);
                    expect(stream.getVideoTracks()[0]).toEqual(videoTrack);
                });

                it("`isCameraEnabled` should be true", async () => {
                    await localMedia.start();

                    expect(localMedia.isCameraEnabled()).toEqual(true);
                });

                it("`isMicrophoneEnabled` should be true", async () => {
                    await localMedia.start();

                    expect(localMedia.isMicrophoneEnabled()).toEqual(true);
                });

                it("should dispatch 'stream_updated' containing stream with tracks", async () => {
                    const eventHandler = jest.fn();
                    localMedia.addEventListener("stream_updated", eventHandler);

                    await localMedia.start();

                    expect(eventHandler).toHaveBeenCalled();
                });
            });
        });

        describe("stop()", () => {
            it("should stop all tracks", async () => {
                const audioTrack = new MockMediaStreamTrack("audio");
                const videoTrack = new MockMediaStreamTrack("video");
                mockedMediaDevices.getUserMedia.mockResolvedValueOnce(new MediaStream([audioTrack, videoTrack]));

                await localMedia.start();
                localMedia.stop();

                expect(audioTrack.stop).toHaveBeenCalled();
                expect(videoTrack.stop).toHaveBeenCalled();
            });
        });

        describe("toggleCameraEnabled()", () => {
            let localMedia: LocalMedia;

            describe("when camera is enabled", () => {
                let audioTrack: MediaStreamTrack;
                let videoTrack: MediaStreamTrack;

                beforeEach(async () => {
                    audioTrack = new MockMediaStreamTrack("audio");
                    videoTrack = new MockMediaStreamTrack("video");
                    mockedMediaDevices.getUserMedia.mockResolvedValueOnce(new MediaStream([audioTrack, videoTrack]));
                    localMedia = new LocalMedia({ audio: true, video: true });

                    await localMedia.start();
                });

                [undefined, false].forEach((val) => {
                    describe(`when called with ${val}`, () => {
                        it("should stop the existing video track", async () => {
                            await localMedia.toggleCameraEnabled(val);

                            expect(videoTrack.stop).toHaveBeenCalled();
                        });

                        it("`isCameraEnabled()` should be false", async () => {
                            await localMedia.toggleCameraEnabled(val);

                            expect(localMedia.isCameraEnabled()).toEqual(false);
                        });

                        it("should dispatch `camera_enabled`", async () => {
                            const eventListener = jest.fn();
                            localMedia.addEventListener("camera_enabled", eventListener);

                            await localMedia.toggleCameraEnabled(val);

                            expect(eventListener).toHaveBeenCalledWith(
                                new CustomEvent("camera_enable", { detail: { enabled: false } })
                            );
                        });

                        it("should dispatch `stopresumevideo` on stream", async () => {
                            const eventListener = jest.fn();
                            localMedia.stream.addEventListener("stopresumevideo", eventListener);

                            await localMedia.toggleCameraEnabled(val);

                            expect(eventListener).toHaveBeenCalledWith(
                                new CustomEvent("stopresumevideo", { detail: { track: videoTrack, enable: false } })
                            );
                        });
                    });
                });
            });

            describe("when camera is disabled", () => {
                let newVideoTrack: MediaStreamTrack;

                beforeEach(async () => {
                    newVideoTrack = new MockMediaStreamTrack("video");
                    mockedMediaDevices.getUserMedia.mockResolvedValueOnce(new MockMediaStream([]));
                    mockedMediaDevices.getUserMedia.mockResolvedValueOnce(new MockMediaStream([newVideoTrack]));
                    localMedia = new LocalMedia({ video: false });
                    await localMedia.start();
                });

                [undefined, true].forEach((val) => {
                    describe(`when called with ${val}`, () => {
                        it("should call getUserMedia", async () => {
                            await localMedia.toggleCameraEnabled(val);

                            expect(mockMediaDevices.getUserMedia).toBeCalled();
                        });

                        it("should add new video track to stream", async () => {
                            await localMedia.toggleCameraEnabled(val);

                            expect(localMedia.stream.getVideoTracks()[0]).toEqual(newVideoTrack);
                        });

                        it("should dispatch `camera_enabled`", async () => {
                            const eventListener = jest.fn();
                            localMedia.addEventListener("camera_enabled", eventListener);

                            await localMedia.toggleCameraEnabled(val);

                            expect(eventListener).toHaveBeenCalledWith(
                                new CustomEvent("camera_enable", { detail: { enabled: true } })
                            );
                        });

                        it("should dispatch `stopresumevideo` on stream", async () => {
                            const eventListener = jest.fn();
                            localMedia.stream.addEventListener("stopresumevideo", eventListener);

                            await localMedia.toggleCameraEnabled(val);

                            expect(eventListener).toHaveBeenCalledWith(
                                new CustomEvent("stopresumevideo", { detail: { track: newVideoTrack, enable: true } })
                            );
                        });
                    });
                });
            });
        });
    });
});
