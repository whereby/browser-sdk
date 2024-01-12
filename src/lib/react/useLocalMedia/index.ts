import { useCallback, useEffect, useState } from "react";
import {
    setCurrentCameraDeviceId,
    setCurrentMicrophoneDeviceId,
    doStartLocalMedia,
    doStopLocalMedia,
    toggleCameraEnabled,
    toggleMicrophoneEnabled,
} from "../../core/redux/slices/localMedia";
import { LocalMediaState, UseLocalMediaOptions, UseLocalMediaResult } from "./types";
import { selectLocalMediaState } from "./selector";
import { createStore, observeStore, Store } from "../../core/redux/store";
import { createServices } from "../../services";

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

        return () => {
            unsubscribe();
            store.dispatch(doStopLocalMedia());
        };
    }, []);

    const setCameraDevice = useCallback(
        (deviceId: string) => store.dispatch(setCurrentCameraDeviceId({ deviceId })),
        [store]
    );
    const setMicrophoneDevice = useCallback(
        (deviceId: string) => store.dispatch(setCurrentMicrophoneDeviceId({ deviceId })),
        [store]
    );
    const toggleCamera = useCallback((enabled?: boolean) => store.dispatch(toggleCameraEnabled({ enabled })), [store]);
    const toggleMicrophone = useCallback(
        (enabled?: boolean) => store.dispatch(toggleMicrophoneEnabled({ enabled })),
        [store]
    );
    return {
        state: localMediaState,
        actions: {
            setCameraDevice,
            setMicrophoneDevice,
            toggleCameraEnabled: toggleCamera,
            toggleMicrophoneEnabled: toggleMicrophone,
        },
        store,
    };
}
