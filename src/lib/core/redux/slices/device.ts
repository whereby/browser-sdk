import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { hasGetDisplayMedia, isMobile } from "@whereby/jslib-media/src/webrtc/MediaDevices";
import debounce from "~/lib/utils/debounce";

import { isTouchDevice } from "../../helpers/device";
import { isFullscreenSupported, isBrowserFullscreen } from "../../helpers/fullscreen";
import { captureSafeAreaInsets } from "../../helpers/safeAreaInsets";
import { requestWakeLock } from "../../helpers/screenWakeLock";
import { RootState } from "../store";
import { createAppAsyncThunk } from "../thunk";
import { selectBrowserIsIos } from "./browserSupport";
import { selectRoomConnectionStatus } from "./roomConnection";

const getSizes = () => ({
    screenHeight: window.screen.height,
    screenWidth: window.screen.width,
    docHeight: window.document.documentElement.clientHeight,
    docWidth: window.document.documentElement.clientWidth,
    safeAreaInsets: captureSafeAreaInsets(),
    // experimental device posture detection. "continuous" is the default, "folded" and "folded-over" are the only other options.
    devicePosture: (navigator as any)["devicePosture"]?.type || "continuous",
});

const init = () => {
    // Skip debouncing resize handler for touch only devices as it only fires once on orientation change. The delay was noticeable: https://github.com/whereby/pwa/pull/659
    const onResize =
        isTouchDevice || (window as any)._backstopTools
            ? doUpdateResolution_
            : debounce(doUpdateResolution_, { delay: 100, edges: true });
    window.addEventListener("load", doUpdateResolution_);
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("beforeunload", () => doSetWindowUnloading());
    window.addEventListener("beforeinstallprompt", (event) => event.preventDefault());
    window.addEventListener("blur", () => doSetWindowIsFocused(false));
    window.addEventListener("focus", () => doSetWindowIsFocused(true));
    window.addEventListener("online", () => doSetWindowIsOnline(true));
    window.addEventListener("offline", () => doSetWindowIsOnline(false));
    window.addEventListener("fullscreenchange", doHandleFullscreenChangeEvent);
    window.addEventListener("webkitfullscreenchange", doHandleFullscreenChangeEvent);
    // experimental device posture detection.
    (navigator as any).devicePosture?.addEventListener("change", doHandleDevicePostureChangeEvent);
};
export const deviceSlice = createSlice({
    name: "device",
    initialState: {
        isWindowUnloading: false,
        isWindowFocused: document.hasFocus(),
        isWindowOnline: window.navigator.onLine,
        hasGetDisplayMedia: hasGetDisplayMedia(),
        isFullscreenSupported: isFullscreenSupported(),
        isRecordSupported: false,
        isAndroidApp: /Android.*(Whereby|Appearin)/.test(window.navigator.userAgent),
        isTouchDevice,
        isMobile,
        wakeLock: null, // null | WakeLockSentinel | "failed"
        ...getSizes(),
    },
    reducers: {
        doSetWindowUnloading: (state) => {
            state.isWindowUnloading = true;
        },
        doSetWindowIsFocused: (state, action: PayloadAction<{ focused: boolean }>) => {
            state.isWindowFocused = action.payload.focused;
        },
        doSetWindowIsOnline: (state, action: PayloadAction<{ online: boolean }>) => {
            state.isWindowOnline = action.payload.online;
        },
        doUpdateResolution_: (state) => {
            state = {
                ...state,
                ...getSizes(),
            };
        },
    },
    getReducer: () => {
        return (state = initialState, { type, payload }) => {
            switch (type) {
                case "WINDOW_FOCUSED":
                    return { ...state, isWindowFocused: payload };
                case "WINDOW_ONLINE":
                    return { ...state, isWindowOnline: payload };
                case "@DEVICE_POSTURE_CHANGED":
                    return { ...state, devicePosture: payload };
                case "WAKE_LOCK_ACTIVATED":
                    return { ...state, wakeLock: payload };
                case "WAKE_LOCK_RELEASED":
                    return { ...state, wakeLock: null };
                case "WAKE_LOCK_ACTIVATION_FAILED":
                    return { ...state, wakeLock: "failed" };
            }
            return state;
        };
    },
});

const doHandleFullscreenChangeEvent = createAppAsyncThunk()
            () =>
            ({ store }) => {
                if (!store.selectFullscreenClientView()) {
                    return;
                } // Reset fullscreenClientId if we exit FS mode w/o using our UI
                if (!isBrowserFullscreen()) {
                    // (mihai:) defer to next frame to avoid race condition within react-tiny-popover
                    setTimeout(() => store.doExitFullscreenMode(), 0);
                }
            },
        doHandleDevicePostureChangeEvent:
            () =>
            ({ store, dispatch }) => {
                const aspectRatio = window.screen.width / window.screen.height;
                if (aspectRatio < 0.5) {
                    store.doPref("floatSelf", navigator.devicePosture?.type === "folded");
                    dispatch({
                        type: "@DEVICE_POSTURE_CHANGED",
                        payload: navigator.devicePosture?.type,
                    });
                }
            },
        doHandleVisibilityChangeEvent:
            () =>
            ({ store, dispatch }) => {
                const wakeLock = store.selectWakeLock();
                if (wakeLock !== null && document.visibilityState === "visible") {
                    requestWakeLock(dispatch);
                }
            },
        doActivateWakeLock:
            () =>
            async ({ dispatch, store }) => {
                if (store.selectWakeLock()) {
                    return;
                }

                const wakeLock = await requestWakeLock(dispatch);

                // If wake lock is not supported, abort
                if (!wakeLock) {
                    dispatch({ type: "WAKE_LOCK_ACTIVATION_FAILED" });
                    return;
                }

                // Reactivate wake lock if the user activates the tab again
                document.addEventListener("visibilitychange", store.doHandleVisibilityChangeEvent);
            },
        doReleaseWakeLock:
            () =>
            ({ store, dispatch }) => {
                const wakeLock = store.selectWakeLock();
                if (wakeLock && wakeLock !== "not_supported") {
                    wakeLock.release();
                    document.removeEventListener("visibilitychange", store.doHandleVisibilityChangeEvent);
                }
                dispatch({ type: "WAKE_LOCK_RELEASED" });
            },

export const selectDeviceRaw = (state: RootState) => state.device;
export const selectIsAndroidApp = (state: RootState) => state.device.isAndroidApp;
export const selectIsTouchDevice = (state: RootState) => state.device.isTouchDevice;
export const selectIsWindowUnloading = (state: RootState) => state.device.isWindowUnloading;
export const selectIsWindowFocused = (state: RootState) => state.device.isWindowFocused;
export const selectIsWindowOnline = (state: RootState) => state.device.isWindowOnline;
export const selectCanFullscreen = (state: RootState) => state.device.isFullscreenSupported;
export const selectIsMobile = (state: RootState) => state.device.isMobile;
export const selectSafeAreaInsets = (state: RootState) => state.device.safeAreaInsets;
export const selectDevicePosture = (state: RootState) => state.device.devicePosture;
export const selectCanScreenshare = createSelector(selectDeviceRaw, (raw) => raw.hasGetDisplayMedia);
export const selectResolution = createSelector(selectDeviceRaw, (raw) => [
    raw.screenWidth || 640,
    raw.screenHeight || 480,
]);
export const selectDocumentSize = createSelector(selectDeviceRaw, (raw) => [raw.docWidth || 640, raw.docHeight || 480]);
export const selectIsPhoneResolution = createSelector(selectResolution, (resolution) => Math.min(...resolution) < 500);
export const selectWakeLock = (state: RootState) => state.device.wakeLock;
export const selectIsPreviewEnabled = createSelector(selectDeviceRaw, selectBrowserIsIos, (raw, browserIsIos) =>
    Boolean(!(raw.isMobile || browserIsIos))
);
// export const selectCanRecord = createSelector(
//     selectDeviceRaw,
//     selectCanStartRecording,
//     selectRecordingTargetIsLocal,
//     selectRecordingCanRecord,
//     (raw, canStartRecording, isLocalRecording, canRecord) => {
//         return (
//             (!isLocalRecording || (raw.hasGetDisplayMedia && raw.isRecordSupported)) && canStartRecording && canRecord
//         );
//     }
// );

export const reactSetWakeLock = createSelector(
    selectWakeLock,
    selectRoomConnectionStatus,
    (wakeLock, roomConnectionStatus) => {
        if (wakeLock === null && "wakeLock" in navigator && roomConnectionStatus === "connected") {
            return {
                actionCreator: "doActivateWakeLock",
            };
        }
        if (wakeLock !== null && wakeLock !== "failed" && roomConnectionStatus !== "connected") {
            return {
                actionCreator: "doReleaseWakeLock",
            };
        }
    }
);
