import { jest } from "@jest/globals";

import LocalMedia, { LocalMediaOptions } from "../LocalMedia";
import MockRtcManager from "../__mocks__/RtcManager";
import MockMediaStream from "../__mocks__/MediaStream";
import MockMediaStreamTrack from "../__mocks__/MediaStreamTrack";
import mockMediaDevices from "../__mocks__/mediaDevices";
import { getStream } from "@whereby/jslib-media/src/webrtc/MediaDevices";

jest.mock("@whereby/jslib-media/src/webrtc/MediaDevices");
const mockedGetStream = jest.mocked(getStream);

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
        let localMediaOptions: LocalMediaOptions;

        beforeEach(() => {
            localMediaOptions = { audio: true, video: true };
            localMedia = new LocalMedia(localMediaOptions);
        });

        describe("start()", () => {
            it("should call getStream with default options", async () => {
                await localMedia.start();

                expect(mockedGetStream).toHaveBeenCalledWith(
                    expect.objectContaining({ audioId: localMediaOptions.audio, videoId: localMediaOptions.video }),
                    { replaceStream: localMedia.stream }
                );
            });

            describe("when getStream succeeds", () => {
                let audioTrack: MediaStreamTrack;
                let videoTrack: MediaStreamTrack;

                beforeEach(() => {
                    audioTrack = new MockMediaStreamTrack("audio");
                    videoTrack = new MockMediaStreamTrack("video");
                    mockedGetStream.mockImplementationOnce((_, { replaceStream }) => {
                        const stream = replaceStream || new MockMediaStream();
                        stream.addTrack(audioTrack);
                        stream.addTrack(videoTrack);
                        return Promise.resolve({ stream });
                    });
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

        describe("started instance", () => {
            beforeEach(async () => {
                await localMedia.start();
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
                    mockedGetStream.mockResolvedValueOnce({ stream: new MockMediaStream() });
                });

                it("should call getStream with given audio device id", () => {
                    localMedia.setMicrophoneDevice(deviceId);

                    expect(mockedGetStream).toHaveBeenCalledWith(
                        expect.objectContaining({
                            audioId: deviceId,
                            videoId: false,
                        }),
                        { replaceStream: localMedia.stream }
                    );
                });

                describe("when getting new audio track succeeeds", () => {
                    let newAudioTrack: MediaStreamTrack;

                    beforeEach(() => {
                        newAudioTrack = new MockMediaStreamTrack("audio");
                        mockedGetStream.mockResolvedValueOnce({ stream: new MockMediaStream([newAudioTrack]) });
                    });

                    it("should emit 'stream_updated' with new track", async () => {
                        const handler = jest.fn();
                        localMedia.addEventListener("stream_updated", handler);

                        await localMedia.setMicrophoneDevice(deviceId);

                        expect(handler).toHaveBeenCalled();
                    });
                });
            });

            describe("stop()", () => {
                it("should stop all tracks", async () => {
                    const audioTrack = new MockMediaStreamTrack("audio");
                    const videoTrack = new MockMediaStreamTrack("video");
                    mockedGetStream.mockImplementationOnce((_, { replaceStream }) => {
                        const stream = replaceStream || new MockMediaStream();
                        stream.addTrack(audioTrack);
                        stream.addTrack(videoTrack);
                        return Promise.resolve({ stream });
                    });
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
                        localMedia = new LocalMedia({ audio: true, video: true });

                        mockedGetStream.mockImplementationOnce((_, { replaceStream }) => {
                            const stream = replaceStream || new MockMediaStream();
                            stream.addTrack(audioTrack);
                            stream.addTrack(videoTrack);
                            return Promise.resolve({ stream });
                        });

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
                        localMedia = new LocalMedia({ audio: false, video: false });
                        mockedGetStream.mockImplementationOnce((_, { replaceStream }) => {
                            const stream = replaceStream || new MockMediaStream();
                            return Promise.resolve({ stream });
                        });
                        await localMedia.start();

                        newVideoTrack = new MockMediaStreamTrack("video");
                        mockedGetStream.mockImplementationOnce((_, { replaceStream }) => {
                            const stream = replaceStream || new MockMediaStream();
                            stream.addTrack(newVideoTrack);
                            return Promise.resolve({ stream });
                        });
                    });

                    [undefined, true].forEach((val) => {
                        describe(`when called with ${val}`, () => {
                            it("should call getUserMedia", async () => {
                                await localMedia.toggleCameraEnabled(val);

                                expect(mockedGetStream).toBeCalled();
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
                                    new CustomEvent("stopresumevideo", {
                                        detail: { track: newVideoTrack, enable: true },
                                    })
                                );
                            });
                        });
                    });
                });
            });
        });
    });
});
