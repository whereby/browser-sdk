import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getStream } from "@whereby/jslib-media/src/webrtc/MediaDevices";
import { createAppAsyncThunk } from "../../redux/thunk";
import { RootState } from "../../redux/store";
import { createReactor, startAppListening } from "../../redux/listenerMiddleware";
import { selectAppWantsToJoin } from "../../RoomConnection/redux/slices/app";

type StopResumeVideoEvent = {
    track: MediaStreamTrack;
    enable: boolean;
};

interface LocalMediaEventsMap {
    stopresumevideo: CustomEvent<StopResumeVideoEvent>;
}
type LocalMediaEventKey = keyof LocalMediaEventsMap;
type LocalMediaEventType<T extends LocalMediaEventKey> = LocalMediaEventsMap[T];
type LocalMediaEventPayload<T extends LocalMediaEventKey> = LocalMediaEventType<T> extends CustomEvent<infer U>
    ? U
    : never;
class LocalMediaEvent<T extends LocalMediaEventKey> extends CustomEvent<LocalMediaEventPayload<T>> {
    constructor(eventType: T, eventInitDict?: CustomEventInit<LocalMediaEventPayload<T>>) {
        super(eventType, eventInitDict);
    }
}

export interface LocalMediaOptions {
    audio: boolean;
    video: boolean;
}

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
}

const initialState: LocalMediaState = {
    cameraEnabled: false,
    devices: [],
    isSettingCameraDevice: false,
    isSettingMicrophoneDevice: false,
    isTogglingCamera: false,
    microphoneEnabled: false,
    status: "",
};

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

const reactToggleMicrophone = createAppAsyncThunk("localMedia/doToggleMicrophone", (_, { getState }) => {
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

startAppListening({
    predicate: (action, currentState, previousState) => {
        const oldValue = selectIsMicrophoneEnabled(previousState);
        const newValue = selectIsMicrophoneEnabled(currentState);
        const isReady = selectLocalMediaStatus(previousState) === "started";
        return isReady && oldValue !== newValue;
    },
    effect: (action, { dispatch }) => {
        dispatch(reactToggleMicrophone());
    },
});

const reactToggleCamera = createAppAsyncThunk("localMedia/doToggleCamera", async (_, { getState, rejectWithValue }) => {
    const state = getState();
    const stream = selectLocalMediaStream(state);
    if (!stream) {
        return;
    }
    let track = stream.getVideoTracks()[0];
    const enabled = selectIsCameraEnabled(state);

    // this.dispatchEvent(new LocalMediaEvent("camera_enabled", { detail: { enabled: this._cameraEnabled } }));

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
        stream.dispatchEvent(new LocalMediaEvent("stopresumevideo", { detail: { track, enable: enabled } }));
    } catch (error) {
        return rejectWithValue(error);
    }
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
        dispatch(reactToggleCamera());
    },
});

export const reactSetDevice = createAppAsyncThunk(
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

            return { replacedTracks };
        } catch (error) {
            return rejectWithValue(error);
        }
    }
);

startAppListening({
    predicate: (_action, currentState, previousState) => {
        const oldValue = selectCurrentCameraDeviceId(previousState);
        const newValue = selectCurrentCameraDeviceId(currentState);
        const isReady = selectLocalMediaStatus(previousState) === "started";
        return isReady && oldValue !== newValue;
    },
    effect: (_action, { dispatch }) => {
        dispatch(reactSetDevice({ audio: false, video: true }));
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
        dispatch(reactSetDevice({ audio: true, video: false }));
    },
});

const doUpdateDeviceList = createAppAsyncThunk("localMedia/doUpdateDeviceList", async (_, { rejectWithValue }) => {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return { devices };
    } catch (error) {
        return rejectWithValue(error);
    }
});

export const doStartLocalMedia = createAppAsyncThunk(
    "localMedia/doStartLocalMedia",
    async (payload: LocalMediaOptions | MediaStream, { getState, dispatch, rejectWithValue }) => {
        if (payload instanceof MediaStream) {
            return Promise.resolve({ stream: payload, options: undefined });
        }

        try {
            let state = getState();

            // get permission first
            await navigator.mediaDevices.getUserMedia(payload);
            // then update devices
            await dispatch(doUpdateDeviceList());
            // then get new state
            state = getState();

            const stream = new MediaStream();
            const constraintsOptions = selectLocalMediaConstraintsOptions(state);

            await getStream(
                {
                    ...constraintsOptions,
                    audioId: payload.audio,
                    videoId: payload.video,
                },
                { replaceStream: stream }
            );

            return { stream, options: payload };
        } catch (error) {
            return rejectWithValue(error);
        }
    }
);

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
            state.microphoneEnabled = action.payload.enabled ?? !state.cameraEnabled;
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
    },
    extraReducers: (builder) => {
        builder
            .addCase(reactSetDevice.pending, (state, action) => {
                const { audio, video } = action.meta.arg;
                return {
                    ...state,
                    isSettingCameraDevice: video,
                    isSettingMicrophoneDevice: audio,
                };
            })
            .addCase(reactSetDevice.fulfilled, (state, action) => {
                const { audio, video } = action.meta.arg;
                return {
                    ...state,
                    isSettingCameraDevice: video ? false : state.isSettingCameraDevice,
                    isSettingMicrophoneDevice: audio ? false : state.isSettingMicrophoneDevice,
                };
            })
            .addCase(reactSetDevice.rejected, (state, action) => {
                const { audio, video } = action.meta.arg;
                return {
                    ...state,
                    isSettingCameraDevice: video ? false : state.isSettingCameraDevice,
                    isSettingMicrophoneDevice: audio ? false : state.isSettingMicrophoneDevice,
                    cameraDeviceError: video ? action.error : state.cameraDeviceError,
                    microphoneDeviceError: audio ? action.error : state.microphoneDeviceError,
                };
            })
            .addCase(reactToggleCamera.pending, (state) => {
                return {
                    ...state,
                    isTogglingCamera: true,
                };
            })
            .addCase(reactToggleCamera.fulfilled, (state) => {
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
            .addCase(doStartLocalMedia.fulfilled, (state, { payload: { stream, options } }) => {
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
                    options,
                };
            })
            .addCase(doStartLocalMedia.rejected, (state, action) => {
                return {
                    ...state,
                    status: "error",
                    startError: action.error,
                };
            });
    },
});

/**
 * Reactors
 */

createReactor([selectAppWantsToJoin, selectLocalMediaStatus], ({ dispatch }, appWantsToJoin, localMediaStatus) => {
    if (appWantsToJoin && localMediaStatus === "") {
        dispatch(doStartLocalMedia({ audio: true, video: true }));
    }
});

export const {
    doSetCurrentCameraDeviceId,
    doSetCurrentMicrophoneDeviceId,
    doToggleCameraEnabled,
    doToggleMicrophoneEnabled,
    doSetLocalMediaOptions,
    doSetLocalMediaStream,
} = localMediaSlice.actions;
