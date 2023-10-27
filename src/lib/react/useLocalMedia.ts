import { useEffect, useReducer, useState } from "react";
import { LocalMedia } from "./";

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

interface LocalMediaActions {
    setCameraDevice: InstanceType<typeof LocalMedia>["setCameraDevice"];
    setMicrophoneDevice: InstanceType<typeof LocalMedia>["setMicrophoneDevice"];
    toggleCameraEnabled: InstanceType<typeof LocalMedia>["toggleCameraEnabled"];
    toggleMicrophoneEnabled: InstanceType<typeof LocalMedia>["toggleMichrophoneEnabled"];
}

type LocalMediaEvents =
    | {
          type: "DEVICE_LIST_UPDATED";
          payload: {
              cameraDevices: MediaDeviceInfo[];
              microphoneDevices: MediaDeviceInfo[];
              speakerDevices: MediaDeviceInfo[];
          };
      }
    | {
          type: "LOCAL_STREAM_UPDATED";
          payload: { stream: MediaStream; currentCameraDeviceId?: string; currentMicrophoneDeviceId?: string };
      }
    | { type: "SET_CAMERA_DEVICE" }
    | { type: "SET_CAMERA_DEVICE_COMPLETE" }
    | { type: "SET_CAMERA_DEVICE_ERROR"; payload: unknown }
    | { type: "SET_MICROPHONE_DEVICE" }
    | { type: "SET_MICROPHONE_DEVICE_COMPLETE" }
    | { type: "SET_MICROPHONE_DEVICE_ERROR"; payload: unknown }
    | { type: "START" }
    | { type: "START_COMPLETE" }
    | { type: "START_ERROR"; payload: unknown };

export type LocalMediaRef = { state: LocalMediaState; actions: LocalMediaActions; _ref: LocalMedia };

function reducer(state: LocalMediaState, action: LocalMediaEvents): LocalMediaState {
    switch (action.type) {
        case "DEVICE_LIST_UPDATED":
            return {
                ...state,
                ...action.payload,
            };
        case "LOCAL_STREAM_UPDATED":
            return {
                ...state,
                currentCameraDeviceId: action.payload.currentCameraDeviceId,
                currentMicrophoneDeviceId: action.payload.currentMicrophoneDeviceId,
                localStream: action.payload.stream,
            };
        case "SET_CAMERA_DEVICE":
            return {
                ...state,
                cameraDeviceError: null,
                isSettingCameraDevice: true,
            };
        case "SET_CAMERA_DEVICE_COMPLETE":
            return {
                ...state,
                isSettingCameraDevice: false,
            };
        case "SET_CAMERA_DEVICE_ERROR":
            return {
                ...state,
                cameraDeviceError: action.payload,
                isSettingCameraDevice: false,
            };
        case "SET_MICROPHONE_DEVICE":
            return {
                ...state,
                isSettingMicrophoneDevice: true,
                microphoneDeviceError: null,
            };
        case "SET_MICROPHONE_DEVICE_COMPLETE":
            return {
                ...state,
                isSettingMicrophoneDevice: false,
            };
        case "SET_MICROPHONE_DEVICE_ERROR":
            return {
                ...state,
                isSettingMicrophoneDevice: false,
                microphoneDeviceError: action.payload,
            };
        case "START":
            return {
                ...state,
                isStarting: true,
                startError: null,
            };
        case "START_COMPLETE":
            return {
                ...state,
                isStarting: false,
            };
        case "START_ERROR":
            return {
                ...state,
                isStarting: false,
                startError: action.payload,
            };
        default:
            return state;
    }
}

export default function useLocalMedia(
    constraintsOrStream: MediaStreamConstraints | MediaStream = { audio: true, video: true }
): LocalMediaRef {
    const [localMedia] = useState<LocalMedia>(() => new LocalMedia(constraintsOrStream));
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        localMedia.addEventListener("device_list_updated", (e) => {
            const { cameraDevices, microphoneDevices, speakerDevices } = e.detail;
            dispatch({ type: "DEVICE_LIST_UPDATED", payload: { cameraDevices, microphoneDevices, speakerDevices } });
        });

        localMedia.addEventListener("stream_updated", (e) => {
            const { stream } = e.detail;
            dispatch({
                type: "LOCAL_STREAM_UPDATED",
                payload: {
                    stream,
                    currentCameraDeviceId: localMedia.getCameraDeviceId(),
                    currentMicrophoneDeviceId: localMedia.getMicrophoneDeviceId(),
                },
            });
        });

        const start = async () => {
            dispatch({ type: "START" });
            try {
                await localMedia.start();
                dispatch({ type: "START_COMPLETE" });
            } catch (error) {
                dispatch({ type: "START_ERROR", payload: error });
            }
        };
        start();

        // Perform cleanup on unmount
        return () => {
            localMedia.stop();
        };
    }, []);

    return {
        state,
        actions: {
            setCameraDevice: async (...args) => {
                dispatch({ type: "SET_CAMERA_DEVICE" });
                try {
                    await localMedia.setCameraDevice(...args);
                    dispatch({ type: "SET_CAMERA_DEVICE_COMPLETE" });
                } catch (error) {
                    dispatch({ type: "SET_CAMERA_DEVICE_ERROR", payload: error });
                }
            },
            setMicrophoneDevice: async (...args) => {
                dispatch({ type: "SET_MICROPHONE_DEVICE" });
                try {
                    await localMedia.setMicrophoneDevice(...args);
                    dispatch({ type: "SET_MICROPHONE_DEVICE_COMPLETE" });
                } catch (error) {
                    dispatch({ type: "SET_MICROPHONE_DEVICE_ERROR", payload: error });
                }
            },
            toggleCameraEnabled: (...args) => {
                return localMedia.toggleCameraEnabled(...args);
            },
            toggleMicrophoneEnabled: (...args) => {
                return localMedia.toggleMichrophoneEnabled(...args);
            },
        },
        _ref: localMedia,
    };
}
