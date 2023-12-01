import { createSelector } from "@reduxjs/toolkit";
import { useCallback, useEffect, useState } from "react";
import {
    doSetCurrentCameraDeviceId,
    doSetCurrentMicrophoneDeviceId,
    doStartLocalMedia,
    doToggleCameraEnabled,
    doToggleMicrophoneEnabled,
    LocalMediaOptions,
    selectCameraDeviceError,
    selectCameraDevices,
    selectCurrentCameraDeviceId,
    selectCurrentMicrophoneDeviceId,
    selectIsLocalMediaStarting,
    selectIsSettingCameraDevice,
    selectIsSettingMicrophoneDevice,
    selectLocalMediaStartError,
    selectLocalMediaStream,
    selectMicrophoneDeviceError,
    selectMicrophoneDevices,
    selectSpeakerDevices,
} from "../../core/redux/slices/localMedia";
import { createStore, observeStore, Store } from "../../core/redux/store";
import { createServices } from "../../services";

interface LocalMediaState {
    currentCameraDeviceId?: string;
    currentMicrophoneDeviceId?: string;
    cameraDeviceError: unknown;
    cameraDevices: MediaDeviceInfo[];
    isSettingCameraDevice: boolean;
    isSettingMicrophoneDevice: boolean;
    isStarting: boolean;
    localStream?: MediaStream;
    microphoneDeviceError: unknown;
    microphoneDevices: MediaDeviceInfo[];
    speakerDevices: MediaDeviceInfo[];
    startError: unknown;
}

interface LocalMediaActions {
    setCameraDevice: (deviceId: string) => void;
    setMicrophoneDevice: (deviceId: string) => void;
    toggleCameraEnabled: (enabled?: boolean) => void;
    toggleMicrophoneEnabled: (enabled?: boolean) => void;
}

export type UseLocalMediaResult = { state: LocalMediaState; actions: LocalMediaActions; store: Store };

export type UseLocalMediaOptions = LocalMediaOptions;

const selectLocalMediaState = createSelector(
    selectCameraDeviceError,
    selectCameraDevices,
    selectCurrentCameraDeviceId,
    selectCurrentMicrophoneDeviceId,
    selectIsSettingCameraDevice,
    selectIsSettingMicrophoneDevice,
    selectIsLocalMediaStarting,
    selectLocalMediaStream,
    selectMicrophoneDeviceError,
    selectMicrophoneDevices,
    selectSpeakerDevices,
    selectLocalMediaStartError,
    (
        cameraDeviceError,
        cameraDevices,
        currentCameraDeviceId,
        currentMicrophoneDeviceId,
        isSettingCameraDevice,
        isSettingMicrophoneDevice,
        isStarting,
        localStream,
        microphoneDeviceError,
        microphoneDevices,
        speakerDevices,
        startError
    ) => {
        const state: LocalMediaState = {
            cameraDeviceError,
            cameraDevices,
            currentCameraDeviceId,
            currentMicrophoneDeviceId,
            isSettingCameraDevice,
            isSettingMicrophoneDevice,
            isStarting,
            localStream,
            microphoneDeviceError,
            microphoneDevices,
            speakerDevices,
            startError,
        };
        return state;
    }
);
const initialState: LocalMediaState = {
    cameraDeviceError: null,
    cameraDevices: [],
    isSettingCameraDevice: false,
    isSettingMicrophoneDevice: false,
    isStarting: false,
    microphoneDeviceError: null,
    microphoneDevices: [],
    speakerDevices: [],
    startError: null,
};

export function useLocalMedia(
    optionsOrStream: UseLocalMediaOptions | MediaStream = { audio: true, video: true }
): UseLocalMediaResult {
    const [store] = useState<Store>(() => {
        const services = createServices();
        return createStore({ injectServices: services });
    });
    const [localMediaState, setLocalMediaState] = useState(initialState);
    useEffect(() => {
        const unsubscribe = observeStore(store, selectLocalMediaState, setLocalMediaState);
        store.dispatch(doStartLocalMedia(optionsOrStream));
        return unsubscribe;
    }, []);

    const setCameraDevice = useCallback(
        (deviceId: string) => store.dispatch(doSetCurrentCameraDeviceId({ deviceId })),
        [store]
    );
    const setMicrophoneDevice = useCallback(
        (deviceId: string) => store.dispatch(doSetCurrentMicrophoneDeviceId({ deviceId })),
        [store]
    );
    const toggleCameraEnabled = useCallback(
        (enabled?: boolean) => store.dispatch(doToggleCameraEnabled({ enabled })),
        [store]
    );
    const toggleMicrophoneEnabled = useCallback(
        (enabled?: boolean) => store.dispatch(doToggleMicrophoneEnabled({ enabled })),
        [store]
    );
    return {
        state: localMediaState,
        actions: {
            setCameraDevice,
            setMicrophoneDevice,
            toggleCameraEnabled,
            toggleMicrophoneEnabled,
        },
        store,
    };
}
