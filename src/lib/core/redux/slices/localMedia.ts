import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getStream, getUpdatedDevices, getDeviceData } from "@whereby/jslib-media/src/webrtc/MediaDevices";
import { createAppAsyncThunk, createAppThunk } from "../../redux/thunk";
import { RootState } from "../../redux/store";
import { createReactor, startAppListening } from "../../redux/listenerMiddleware";
import { doAppJoin, selectAppWantsToJoin } from "./app";
import debounce from "../../../utils/debounce";

export type LocalMediaOptions = {
    audio: boolean;
    video: boolean;
};

/**
 * Reducer
 */

export interface LocalMediaState {
    cameraDeviceError?: unknown;
    cameraEnabled: boolean;
    currentCameraDeviceId?: string;
    currentMicrophoneDeviceId?: string;
    devices: MediaDeviceInfo[];
    isSettingCameraDevice: boolean;
    isSettingMicrophoneDevice: boolean;
    isTogglingCamera: boolean;
    microphoneDeviceError?: unknown;
    microphoneEnabled: boolean;
    options?: LocalMediaOptions;
    screenshareStream?: MediaStream;
    status: "" | "stopped" | "starting" | "started" | "error";
    startError?: unknown;
    stream?: MediaStream;
    isSwitchingStream: boolean;
    onDeviceChange?: () => void;
}

export const initialState: LocalMediaState = {
    cameraEnabled: false,
    devices: [],
    isSettingCameraDevice: false,
    isSettingMicrophoneDevice: false,
    isTogglingCamera: false,
    microphoneEnabled: false,
    status: "",
    isSwitchingStream: false,
};

export const localMediaSlice = createSlice({
    name: "localMedia",
    initialState,
    reducers: {
        doToggleCameraEnabled(state, action: PayloadAction<{ enabled?: boolean }>) {
            state.cameraEnabled = action.payload.enabled ?? !state.cameraEnabled;
        },
        doSetCurrentCameraDeviceId(state, action: PayloadAction<{ deviceId?: string }>) {
            state.currentCameraDeviceId = action.payload.deviceId;
        },
        doToggleMicrophoneEnabled(state, action: PayloadAction<{ enabled?: boolean }>) {
            state.microphoneEnabled = action.payload.enabled ?? !state.microphoneEnabled;
        },
        doSetCurrentMicrophoneDeviceId(state, action: PayloadAction<{ deviceId?: string }>) {
            state.currentMicrophoneDeviceId = action.payload.deviceId;
        },
        doSetDevices(state, action: PayloadAction<{ devices: MediaDeviceInfo[] }>) {
            state.devices = action.payload.devices;
        },
        doSetLocalMediaStream(state, action: PayloadAction<{ stream: MediaStream }>) {
            state.stream = action.payload.stream;
        },
        doSetLocalMediaOptions(state, action: PayloadAction<{ options: LocalMediaOptions }>) {
            state.options = action.payload.options;
        },
        localMediaStopped(state) {
            return {
                ...state,
                status: "stopped",
                stream: undefined,
            };
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        stopScreenshare(state, action: PayloadAction<{ stream: MediaStream }>) {
            return {
                ...state,
                screenshareStream: undefined,
            };
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(doAppJoin, (state, action) => {
                return {
                    ...state,
                    options: action.payload.localMediaOptions,
                };
            })
            .addCase(doSetDevice.pending, (state, action) => {
                const { audio, video } = action.meta.arg;
                return {
                    ...state,
                    isSettingCameraDevice: video,
                    isSettingMicrophoneDevice: audio,
                };
            })
            .addCase(doSetDevice.fulfilled, (state, action) => {
                const { audio, video } = action.meta.arg;
                return {
                    ...state,
                    isSettingCameraDevice: video ? false : state.isSettingCameraDevice,
                    isSettingMicrophoneDevice: audio ? false : state.isSettingMicrophoneDevice,
                };
            })
            .addCase(doSetDevice.rejected, (state, action) => {
                const { audio, video } = action.meta.arg;
                return {
                    ...state,
                    isSettingCameraDevice: video ? false : state.isSettingCameraDevice,
                    isSettingMicrophoneDevice: audio ? false : state.isSettingMicrophoneDevice,
                    cameraDeviceError: video ? action.error : state.cameraDeviceError,
                    microphoneDeviceError: audio ? action.error : state.microphoneDeviceError,
                };
            })
            .addCase(doToggleCamera.pending, (state) => {
                return {
                    ...state,
                    isTogglingCamera: true,
                };
            })
            .addCase(doToggleCamera.fulfilled, (state) => {
                return {
                    ...state,
                    isTogglingCamera: false,
                };
            })
            .addCase(doUpdateDeviceList.fulfilled, (state, action) => {
                return {
                    ...state,
                    devices: action.payload.devices,
                };
            })
            .addCase(doStartLocalMedia.pending, (state) => {
                return {
                    ...state,
                    status: "starting",
                };
            })
            .addCase(doStartLocalMedia.fulfilled, (state, { payload: { stream, onDeviceChange } }) => {
                let cameraDeviceId = undefined;
                let cameraEnabled = false;
                let microphoneDeviceId = undefined;
                let microphoneEnabled = false;

                const audioTrack = stream.getAudioTracks()[0];
                const videoTrack = stream.getVideoTracks()[0];

                if (audioTrack) {
                    microphoneDeviceId = audioTrack.getSettings().deviceId;
                    microphoneEnabled = audioTrack.enabled;
                }

                if (videoTrack) {
                    cameraEnabled = videoTrack.enabled;
                    cameraDeviceId = videoTrack.getSettings().deviceId;
                }

                return {
                    ...state,
                    stream,
                    status: "started",
                    currentCameraDeviceId: cameraDeviceId,
                    currentMicrophoneDeviceId: microphoneDeviceId,
                    cameraEnabled,
                    microphoneEnabled,
                    onDeviceChange,
                };
            })
            .addCase(doStartLocalMedia.rejected, (state, action) => {
                return {
                    ...state,
                    status: "error",
                    startError: action.error,
                };
            })
            .addCase(doStartScreenshare.fulfilled, (state, { payload: { stream } }) => {
                return {
                    ...state,
                    screenshareStream: stream,
                };
            })
            .addCase(doStartScreenshare.rejected, (state) => {
                return {
                    ...state,
                    screenshareStream: undefined,
                };
            })
            .addCase(doSwitchLocalStream.pending, (state) => {
                return {
                    ...state,
                    isSwitchingStream: true,
                };
            })
            .addCase(doSwitchLocalStream.fulfilled, (state) => {
                const deviceData = getDeviceData({
                    devices: state.devices,
                    audioTrack: state.stream?.getAudioTracks()[0],
                    videoTrack: state.stream?.getVideoTracks()[0],
                });

                return {
                    ...state,
                    isSwitchingStream: false,
                    currentCameraDeviceId: deviceData.video.deviceId,
                    currentMicrophoneDeviceId: deviceData.audio.deviceId,
                };
            })
            .addCase(doSwitchLocalStream.rejected, (state) => {
                return {
                    ...state,
                    isSwitchingStream: false,
                };
            });
    },
});

/**
 * Action creators
 */

export const {
    doSetCurrentCameraDeviceId,
    doSetCurrentMicrophoneDeviceId,
    doToggleCameraEnabled,
    doToggleMicrophoneEnabled,
    doSetLocalMediaOptions,
    doSetLocalMediaStream,
    localMediaStopped,
    stopScreenshare,
} = localMediaSlice.actions;

const doToggleCamera = createAppAsyncThunk("localMedia/doToggleCamera", async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const stream = selectLocalMediaStream(state);
    if (!stream) {
        return;
    }
    let track = stream.getVideoTracks()[0];
    const enabled = selectIsCameraEnabled(state);

    // Only stop tracks if we fully own the media stream
    const shouldStopTrack = selectLocalMediaOwnsStream(state);

    try {
        if (enabled) {
            if (track) {
                // We have existing video track, just enable it
                track.enabled = true;
            } else {
                // We dont have video track, get new one
                const constraintsOptions = selectLocalMediaConstraintsOptions(state);
                const cameraDeviceId = selectCurrentCameraDeviceId(state);
                await getStream(
                    {
                        ...constraintsOptions,
                        audioId: false,
                        videoId: cameraDeviceId,
                        type: "exact",
                    },
                    { replaceStream: stream }
                );

                track = stream.getVideoTracks()[0];
            }
        } else {
            if (!track) {
                return;
            }

            track.enabled = false;

            if (shouldStopTrack) {
                track.stop();
                stream.removeTrack(track);
            }
        }

        // Dispatch event on stream to allow RTC layer effects
        stream.dispatchEvent(new CustomEvent("stopresumevideo", { detail: { track, enable: enabled } }));
    } catch (error) {
        return rejectWithValue(error);
    }
});

const doToggleMicrophone = createAppAsyncThunk("localMedia/doToggleMicrophone", (_, { getState }) => {
    const state = getState();
    const stream = selectLocalMediaStream(state);
    if (!stream) {
        return;
    }
    const enabled = selectIsMicrophoneEnabled(state);
    const audioTrack = stream.getAudioTracks()?.[0];
    if (!audioTrack) {
        return;
    }

    audioTrack.enabled = enabled;
});

export const doSetDevice = createAppAsyncThunk(
    "localMedia/reactSetDevice",
    async ({ audio, video }: { audio: boolean; video: boolean }, { getState, rejectWithValue }) => {
        try {
            const state = getState();
            const stream = selectLocalMediaStream(state);
            if (!stream) {
                throw new Error("No stream");
            }
            const audioId = audio ? selectCurrentMicrophoneDeviceId(state) : false;
            const videoId = video ? selectCurrentCameraDeviceId(state) : false;
            const constraintsOptions = selectLocalMediaConstraintsOptions(state);

            const { replacedTracks } = await getStream(
                {
                    ...constraintsOptions,
                    audioId,
                    videoId,
                    type: "exact",
                },
                { replaceStream: stream }
            );

            const isAudioEnabled = selectIsMicrophoneEnabled(state);
            stream.getAudioTracks().forEach((track) => (track.enabled = isAudioEnabled));

            const isVideoEnabled = selectIsCameraEnabled(state);
            stream.getVideoTracks().forEach((track) => (track.enabled = isVideoEnabled));

            return { replacedTracks };
        } catch (error) {
            return rejectWithValue(error);
        }
    }
);

export const doUpdateDeviceList = createAppAsyncThunk(
    "localMedia/doUpdateDeviceList",
    async (_, { getState, dispatch, rejectWithValue }) => {
        const state = getState();
        let newDevices: MediaDeviceInfo[] = [];
        let oldDevices: MediaDeviceInfo[] = [];
        const stream = selectLocalMediaStream(state);

        try {
            newDevices = await navigator.mediaDevices.enumerateDevices();
            oldDevices = selectLocalMediaDevices(state);

            const shouldHandleDeviceUpdate =
                stream &&
                !selectLocalMediaIsSwitchingStream(state) &&
                newDevices &&
                oldDevices &&
                oldDevices.find((d) => d.deviceId);

            if (!shouldHandleDeviceUpdate) {
                return { devices: newDevices };
            }

            const { changedDevices } = getUpdatedDevices({
                oldDevices,
                newDevices,
                currentAudioId: selectCurrentMicrophoneDeviceId(state),
                currentVideoId: selectCurrentCameraDeviceId(state),
            });

            let autoSwitchAudioId = changedDevices.audioinput?.deviceId;
            let autoSwitchVideoId = changedDevices.videoinput?.deviceId;

            // eslint-disable-next-line no-inner-declarations
            function nextId(devices: MediaDeviceInfo[], id?: string) {
                const curIdx = id ? devices.findIndex((d) => d.deviceId === id) : 0;
                return (devices[(curIdx + 1) % devices.length] || {}).deviceId;
            }

            if (autoSwitchVideoId !== undefined) {
                const videoDevices = selectLocalMediaDevices(state).filter((d) => d.kind === "videoinput");
                const videoId = selectCurrentCameraDeviceId(state);

                let nextVideoId = nextId(videoDevices, videoId);
                if (!nextVideoId || videoId === nextVideoId) {
                    nextVideoId = nextId(videoDevices, videoId);
                }
                if (videoId !== nextVideoId) {
                    autoSwitchVideoId = nextVideoId;
                }
            }

            if (autoSwitchAudioId !== undefined) {
                const audioDevices = selectLocalMediaDevices(state).filter((d) => d.kind === "audioinput");
                const audioId = selectCurrentMicrophoneDeviceId(state);

                let nextAudioId = nextId(audioDevices, audioId);
                if (!nextAudioId || audioId === nextAudioId) {
                    nextAudioId = nextId(audioDevices, audioId);
                }
                if (audioId !== nextAudioId) {
                    autoSwitchAudioId = nextAudioId;
                }
            }

            if (autoSwitchAudioId !== undefined || autoSwitchVideoId !== undefined) {
                dispatch(doSwitchLocalStream({ audioId: autoSwitchAudioId, videoId: autoSwitchVideoId }));
            }

            return { devices: newDevices };
        } catch (error) {
            return rejectWithValue(error);
        }
    }
);

export const doSwitchLocalStream = createAppAsyncThunk(
    "localMedia/doSwitchLocalStream",
    async ({ audioId, videoId }: { audioId?: string; videoId?: string }, { getState, rejectWithValue }) => {
        const state = getState();
        const replaceStream = selectLocalMediaStream(state);
        const constraintsOptions = selectLocalMediaConstraintsOptions(state);
        if (!replaceStream) {
            // Switching no stream makes no sense
            return;
        }

        try {
            const { replacedTracks } = await getStream(
                {
                    ...constraintsOptions,
                    audioId: audioId === undefined ? false : audioId,
                    videoId: videoId === undefined ? false : videoId,
                    type: "exact",
                },
                { replaceStream }
            );

            return { replacedTracks };
        } catch (error) {
            console.error(error);
            return rejectWithValue(error);
        }
    }
);

export const doStartLocalMedia = createAppAsyncThunk(
    "localMedia/doStartLocalMedia",
    async (payload: LocalMediaOptions | MediaStream, { getState, dispatch, rejectWithValue }) => {
        const onDeviceChange = debounce(
            () => {
                dispatch(doUpdateDeviceList());
            },
            { delay: 500 }
        );

        if (global.navigator.mediaDevices) {
            global.navigator.mediaDevices.addEventListener("devicechange", onDeviceChange);
        }

        // Resolve if existing stream is passed
        if ("getTracks" in payload) {
            return Promise.resolve({ stream: payload, onDeviceChange });
        }

        if (!(payload.audio || payload.video)) {
            return { stream: new MediaStream(), onDeviceChange };
        } else {
            dispatch(doSetLocalMediaOptions({ options: payload }));
        }

        try {
            // then update devices
            await dispatch(doUpdateDeviceList());
            // then get new state
            const state = getState();

            const constraintsOptions = selectLocalMediaConstraintsOptions(state);

            const { stream } = await getStream({
                ...constraintsOptions,
                audioId: payload.audio,
                videoId: payload.video,
            });

            return { stream, onDeviceChange };
        } catch (error) {
            return rejectWithValue(error);
        }
    }
);

export const doStopLocalMedia = createAppThunk(() => (dispatch, getState) => {
    const screenshareStream = selectScreenshareStream(getState());
    const stream = selectLocalMediaStream(getState());
    const onDeviceChange = selectLocalMediaRaw(getState()).onDeviceChange;

    screenshareStream?.getTracks().forEach((track) => {
        track.stop();
    });

    stream?.getTracks().forEach((track) => {
        track.stop();
    });

    if (global.navigator.mediaDevices && onDeviceChange) {
        global.navigator.mediaDevices.removeEventListener("devicechange", onDeviceChange);
    }

    dispatch(localMediaStopped());
});

export const doStartScreenshare = createAppAsyncThunk(
    "localMedia/doStartScreenshare",
    async (_, { dispatch, getState, rejectWithValue }) => {
        try {
            const state = getState();
            const screenshareStream = selectScreenshareStream(state);

            if (screenshareStream) {
                return { stream: screenshareStream };
            }

            const stream = await navigator.mediaDevices.getDisplayMedia();

            const onEnded = () => {
                dispatch(doStopScreenshare());
            };

            if ("oninactive" in stream) {
                // Chrome
                stream.addEventListener("inactive", onEnded);
            } else {
                // Firefox
                stream.getVideoTracks()[0]?.addEventListener("ended", onEnded);
            }

            return { stream };
        } catch (error) {
            return rejectWithValue(error);
        }
    }
);

export const doStopScreenshare = createAppThunk(() => (dispatch, getState) => {
    const state = getState();
    const screenshareStream = selectScreenshareStream(state);

    if (!screenshareStream) {
        return;
    }

    screenshareStream.getTracks().forEach((track) => track.stop());
    dispatch(stopScreenshare({ stream: screenshareStream }));
});

/**
 * Selectors
 */

export const selectCameraDeviceError = (state: RootState) => state.localMedia.cameraDeviceError;
export const selectCurrentCameraDeviceId = (state: RootState) => state.localMedia.currentCameraDeviceId;
export const selectCurrentMicrophoneDeviceId = (state: RootState) => state.localMedia.currentMicrophoneDeviceId;
export const selectIsCameraEnabled = (state: RootState) => state.localMedia.cameraEnabled;
export const selectIsMicrophoneEnabled = (state: RootState) => state.localMedia.microphoneEnabled;
export const selectIsSettingCameraDevice = (state: RootState) => state.localMedia.isSettingCameraDevice;
export const selectIsSettingMicrophoneDevice = (state: RootState) => state.localMedia.isSettingMicrophoneDevice;
export const selectIsToggleCamera = (state: RootState) => state.localMedia.isTogglingCamera;
export const selectLocalMediaDevices = (state: RootState) => state.localMedia.devices;
export const selectLocalMediaOptions = (state: RootState) => state.localMedia.options;
export const selectLocalMediaOwnsStream = createSelector(selectLocalMediaOptions, (options) => !!options);
export const selectLocalMediaRaw = (state: RootState) => state.localMedia;
export const selectLocalMediaStatus = (state: RootState) => state.localMedia.status;
export const selectLocalMediaStream = (state: RootState) => state.localMedia.stream;
export const selectMicrophoneDeviceError = (state: RootState) => state.localMedia.microphoneDeviceError;
export const selectScreenshareStream = (state: RootState) => state.localMedia.screenshareStream;
export const selectLocalMediaStartError = (state: RootState) => state.localMedia.startError;
export const selectLocalMediaIsSwitchingStream = (state: RootState) => state.localMedia.isSwitchingStream;
export const selectLocalMediaConstraintsOptions = createSelector(selectLocalMediaDevices, (devices) => ({
    devices,
    options: {
        disableAEC: false,
        disableAGC: false,
        hd: true,
        lax: false,
        lowDataMode: false,
        simulcast: true,
        widescreen: true,
    },
}));
export const selectIsLocalMediaStarting = createSelector(selectLocalMediaStatus, (status) => status === "starting");
export const selectCameraDevices = createSelector(selectLocalMediaDevices, (devices) =>
    devices.filter((d) => d.kind === "videoinput")
);
export const selectMicrophoneDevices = createSelector(selectLocalMediaDevices, (devices) =>
    devices.filter((d) => d.kind === "audioinput")
);
export const selectSpeakerDevices = createSelector(selectLocalMediaDevices, (devices) =>
    devices.filter((d) => d.kind === "audiooutput")
);

/**
 * Reactors
 */

// Start localMedia unless started when roomConnection is wanted
export const selectLocalMediaShouldStartWithOptions = createSelector(
    selectAppWantsToJoin,
    selectLocalMediaStatus,
    selectLocalMediaOptions,
    (appWantsToJoin, localMediaStatus, localMediaOptions) => {
        if (appWantsToJoin && localMediaStatus === "" && localMediaOptions) {
            return localMediaOptions;
        }
    }
);

createReactor([selectLocalMediaShouldStartWithOptions], ({ dispatch }, options) => {
    if (options) {
        dispatch(doStartLocalMedia(options));
    }
});

// Stop localMedia when roomConnection is no longer wanted and media was started when joining
export const selectLocalMediaShouldStop = createSelector(
    selectAppWantsToJoin,
    selectLocalMediaStatus,
    selectLocalMediaOptions,
    (appWantsToJoin, localMediaStatus, localMediaOptions) => {
        return !appWantsToJoin && localMediaStatus !== "" && !!localMediaOptions;
    }
);

createReactor([selectLocalMediaShouldStop], ({ dispatch }, localMediaShouldStop) => {
    if (localMediaShouldStop) {
        dispatch(doStopLocalMedia());
    }
});

startAppListening({
    predicate: (_action, currentState, previousState) => {
        const oldValue = selectIsMicrophoneEnabled(previousState);
        const newValue = selectIsMicrophoneEnabled(currentState);
        const isReady = selectLocalMediaStatus(previousState) === "started";
        return isReady && oldValue !== newValue;
    },
    effect: (_, { dispatch }) => {
        dispatch(doToggleMicrophone());
    },
});

startAppListening({
    predicate: (_action, currentState, previousState) => {
        const isToggling = selectIsToggleCamera(currentState);
        if (isToggling) {
            return false;
        }
        const oldValue = selectIsCameraEnabled(previousState);
        const newValue = selectIsCameraEnabled(currentState);
        const isReady = selectLocalMediaStatus(previousState) === "started";
        return isReady && oldValue !== newValue;
    },
    effect: (_action, { dispatch }) => {
        dispatch(doToggleCamera());
    },
});

startAppListening({
    predicate: (_action, currentState, previousState) => {
        const oldValue = selectCurrentCameraDeviceId(previousState);
        const newValue = selectCurrentCameraDeviceId(currentState);
        const isReady = selectLocalMediaStatus(previousState) === "started";
        return isReady && oldValue !== newValue;
    },
    effect: (_action, { dispatch }) => {
        dispatch(doSetDevice({ audio: false, video: true }));
    },
});

startAppListening({
    predicate: (_action, currentState, previousState) => {
        const oldValue = selectCurrentMicrophoneDeviceId(previousState);
        const newValue = selectCurrentMicrophoneDeviceId(currentState);
        const isReady = selectLocalMediaStatus(previousState) === "started";
        return isReady && oldValue !== newValue;
    },
    effect: (_action, { dispatch }) => {
        dispatch(doSetDevice({ audio: true, video: false }));
    },
});
