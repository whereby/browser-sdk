import { jest } from "@jest/globals";
import { act, renderHook, waitFor } from "@testing-library/react";
import useLocalMedia from "../useLocalMedia";
import LocalMedia from "../../LocalMedia";
import MockMediaStream from "../../__mocks__/MediaStream";

jest.mock("../../LocalMedia");
const MockedLocalMedia = jest.mocked(LocalMedia);

describe("useLocalMedia", () => {
    beforeEach(() => {
        MockedLocalMedia.mockClear();
    });

    it("should assume audio and video by default", () => {
        renderHook(() => useLocalMedia());

        expect(MockedLocalMedia.mock.calls[0]).toEqual([{ audio: true, video: true }]);
    });

    it.each([
        { audio: true, video: true },
        { audio: true, video: false },
        { audio: false, video: true },
        { audio: false, video: false },
    ])(`should use provided audio: $audio and video: $video values`, ({ audio, video }) => {
        renderHook(() => useLocalMedia({ audio, video }));

        expect(MockedLocalMedia.mock.calls[0]).toEqual([{ audio, video }]);
    });

    describe("on mount", () => {
        it("should start local media", () => {
            renderHook(() => useLocalMedia());

            expect(MockedLocalMedia.mock.instances[0].start).toHaveBeenCalled();
        });

        it("should update state", () => {
            const { result } = renderHook(() => useLocalMedia());

            expect(result.current.state.isStarting).toEqual(true);
        });

        describe("when start local media succeeds", () => {
            it("should update state", () => {
                const { result } = renderHook(() => useLocalMedia());
                const stream = new MockMediaStream();
                MockedLocalMedia.mock.instances[0].start.mockResolvedValueOnce(stream);

                waitFor(() => {
                    expect(result.current.state.isStarting).toEqual(false);
                    expect(result.current.state.localStream).toEqual(stream);
                });
            });
        });

        describe("when start local media fails", () => {
            it("should update state", () => {
                const { result } = renderHook(() => useLocalMedia());
                const error = "BOOM!";
                MockedLocalMedia.mock.instances[0].start.mockRejectedValueOnce(error);

                waitFor(() => {
                    expect(result.current.state.isStarting).toEqual(false);
                    expect(result.current.state.startError).toEqual(error);
                });
            });
        });
    });

    it("should provide local stream when ready", () => {
        const { result } = renderHook(() => useLocalMedia());
        const localStream = "<stream>";

        act(() => {
            if (MockedLocalMedia.mock.instances[0].addEventListener.mock.lastCall) {
                const cb = MockedLocalMedia.mock.instances[0].addEventListener.mock.lastCall[1];
                if (cb instanceof Function) {
                    cb(
                        new CustomEvent("stream_added", {
                            detail: { stream: localStream },
                        })
                    );
                }
            }
        });

        expect(result.current.state.localStream).toEqual(localStream);
    });

    describe("actions", () => {
        describe("setCameraDevice", () => {
            it("shuld update local state", () => {
                const { result } = renderHook(() => useLocalMedia());

                expect(result.current.state.isSettingCameraDevice).toEqual(false);

                act(() => {
                    result.current.actions.setCameraDevice("<some-device-id>");
                });

                expect(result.current.state.isSettingCameraDevice).toEqual(true);
            });

            it("should invoke setCameraDevice of localMedia with given deviceId", () => {
                const { result } = renderHook(() => useLocalMedia());
                const deviceId = "<some-device-id>";

                act(() => {
                    result.current.actions.setCameraDevice(deviceId);
                });

                expect(MockedLocalMedia.mock.instances[0].setCameraDevice).toHaveBeenCalledWith(deviceId);
            });

            describe("when setting camera device succeeds", () => {
                it("should update local state", async () => {
                    const deviceId = "<some-device-id>";
                    const { result } = renderHook(() => useLocalMedia());
                    MockedLocalMedia.mock.instances[0].setCameraDevice.mockResolvedValueOnce();

                    await act(async () => {
                        await result.current.actions.setCameraDevice(deviceId);
                    });

                    expect(result.current.state.isSettingCameraDevice).toEqual(false);
                });
            });

            describe("when setting camera device fails", () => {
                it("should update local state", async () => {
                    const error = "BOOM!";
                    const { result } = renderHook(() => useLocalMedia());
                    MockedLocalMedia.mock.instances[0].setCameraDevice.mockRejectedValueOnce(error);

                    await act(async () => {
                        await result.current.actions.setCameraDevice("<some-device-id>");
                    });

                    expect(result.current.state.isSettingCameraDevice).toEqual(false);
                    expect(result.current.state.cameraDeviceError).toEqual(error);
                });
            });
        });

        describe("setMicrophoneDevice", () => {
            it("shuld update local state", () => {
                const { result } = renderHook(() => useLocalMedia());

                expect(result.current.state.isSettingMicrophoneDevice).toEqual(false);

                act(() => {
                    result.current.actions.setMicrophoneDevice("<some-device-id>");
                });

                expect(result.current.state.isSettingMicrophoneDevice).toEqual(true);
            });

            it("should invoke setCameraDevice of localMedia with given deviceId", () => {
                const { result } = renderHook(() => useLocalMedia());
                const deviceId = "<some-device-id>";

                act(() => {
                    result.current.actions.setMicrophoneDevice(deviceId);
                });

                expect(MockedLocalMedia.mock.instances[0].setMicrophoneDevice).toHaveBeenCalledWith(deviceId);
            });

            describe("when setting camera device succeeds", () => {
                it("should update local state", async () => {
                    const deviceId = "<some-device-id>";
                    const { result } = renderHook(() => useLocalMedia());
                    MockedLocalMedia.mock.instances[0].setMicrophoneDevice.mockResolvedValueOnce();

                    await act(async () => {
                        await result.current.actions.setMicrophoneDevice(deviceId);
                    });

                    expect(result.current.state.isSettingMicrophoneDevice).toEqual(false);
                });
            });

            describe("when setting camera device fails", () => {
                it("should update local state", async () => {
                    const error = "BOOM!";
                    const { result } = renderHook(() => useLocalMedia());
                    MockedLocalMedia.mock.instances[0].setMicrophoneDevice.mockRejectedValueOnce(error);

                    await act(async () => {
                        await result.current.actions.setMicrophoneDevice("<some-device-id>");
                    });

                    expect(result.current.state.isSettingMicrophoneDevice).toEqual(false);
                    expect(result.current.state.microphoneDeviceError).toEqual(error);
                });
            });
        });

        describe("startScreenshare", () => {
            it("should update local state", () => {
                const { result } = renderHook(() => useLocalMedia());

                act(() => {
                    result.current.actions.startScreenshare();
                });

                expect(result.current.state.isStartingScreenshare).toEqual(true);
            });

            it("should invoke startScreenshare of localMedia", () => {
                const { result } = renderHook(() => useLocalMedia());

                act(() => {
                    result.current.actions.startScreenshare();
                });

                expect(MockedLocalMedia.mock.instances[0].startScreenshare).toHaveBeenCalledTimes(1);
            });

            describe("when starting screenshare succeeds", () => {
                it("should update local state", async () => {
                    const stream = new MockMediaStream();
                    const { result } = renderHook(() => useLocalMedia());
                    MockedLocalMedia.mock.instances[0].startScreenshare.mockResolvedValueOnce(stream);

                    await act(async () => {
                        await result.current.actions.startScreenshare();
                    });

                    expect(result.current.state.isStartingScreenshare).toEqual(false);
                    expect(result.current.state.screenshareStream).toEqual(stream);
                });
            });

            describe("when starting screenshare fails", () => {
                it("should update local state", async () => {
                    const error = new Error("Boom!");
                    const { result } = renderHook(() => useLocalMedia());
                    MockedLocalMedia.mock.instances[0].startScreenshare.mockRejectedValueOnce(error);

                    await act(async () => {
                        await result.current.actions.startScreenshare();
                    });

                    expect(result.current.state.isStartingScreenshare).toEqual(false);
                    expect(result.current.state.startScreenshareError).toEqual(error);
                });
            });
        });

        describe("stopScreenshare", () => {
            it("should invoke stopScreenshare of localMedia", () => {
                const { result } = renderHook(() => useLocalMedia());

                act(() => {
                    result.current.actions.stopScreenshare();
                });

                expect(MockedLocalMedia.mock.instances[0].stopScreenshare).toHaveBeenCalledTimes(1);
            });

            it("should update local state", () => {
                const { result } = renderHook(() => useLocalMedia());

                act(() => {
                    result.current.actions.stopScreenshare();
                });

                expect(result.current.state.screenshareStream).toEqual(undefined);
            });
        });
    });
});
