import adapter from "webrtc-adapter";
import { createSelector, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { selectIsMobile } from "./device";

const { browser, version } = adapter.browserDetails;
// const DAY = 24 * 60 * 60 * 1000;
const videoEl = document.createElement("video");
const vp8 =
    (videoEl && videoEl.canPlayType && videoEl.canPlayType('video/webm; codecs="vp8", vorbis') === "probably") ||
    (browser === "safari" && version && version >= 13);

let screencapture = false;
if (!!(navigator as any).getDisplayMedia || (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)) {
    screencapture = true;
}
if (!/^(https:|chrome-extension:)$/g.test(location.protocol || "")) {
    screencapture = false;
}
const initialState = {
    ...adapter.browserDetails, // browser + version
    ua: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    vp8,
    webrtc: !!window.RTCPeerConnection,
    screencapture,
    mediaStreamContentHint: !!window.MediaStreamTrack && "contentHint" in window.MediaStreamTrack.prototype,
};

export const browserSupportSlice = createSlice({
    name: "browserSupport",
    initialState,
    reducers: {},
});
// const doBrowserSupportAcceptPartial = () => ({
//     type: "BROWSERSUPPORT_ACCEPT_PARTIAL",
//     meta: {
//         persist: { browserSupportAcceptedPartial: Date.now() },
//     },
// });

export const selectBrowserSupportRaw = (state: RootState) => state.browserSupport;
export const selectBrowserSupportBrowser = (state: RootState) => state.browserSupport.browser;
export const selectBrowserSupportSFU = (state: RootState) => state.browserSupport.vp8;
export const selectBrowserSupportWebRTC = (state: RootState) => state.browserSupport.webrtc;
export const selectBrowserSupportMediaStreamContentHint = (state: RootState) =>
    state.browserSupport.mediaStreamContentHint;

// const selectBrowserSupportIgnored = createSelector(
//     "selectPersisted",
//     "selectAppStartTime",
//     (persisted, appStartTime) => {
//         const accepted = persisted.browserSupportAcceptedPartial;
//         return accepted + DAY > appStartTime;
//     }
// );
export const selectBrowserIsSafari17 = createSelector(selectBrowserSupportRaw, ({ ua }) => {
    // Match Safari ua like
    // "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1289289 Safari/605.1.15"
    return !!ua.match(/Version\/17\.\d+\sSafari/gi);
});
export const selectBrowserIsIos = createSelector(
    selectBrowserSupportRaw,
    ({ ua, maxTouchPoints }) =>
        /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh; Intel Mac") && maxTouchPoints > 1)
);
export const selectBrowserOsIsLegacy = createSelector(
    selectBrowserSupportRaw,
    ({ ua }) => ua.includes("Windows NT 6.1") || ua.includes("Windows NT 6.2") || ua.includes("Windows NT 6.3")
);
export const selectCanJoinUsingIosBrowser = createSelector(
    selectBrowserSupportRaw,
    selectBrowserIsIos,
    (raw, browserIsIos) => browserIsIos && raw.browser === "safari"
);
export const selectShouldShowBrowserSupport = createSelector(
    selectBrowserSupportRaw,
    selectBrowserIsIos,
    // selectBrowserSupportIgnored,
    selectCanJoinUsingIosBrowser,
    selectIsMobile,
    selectBrowserOsIsLegacy,
    (raw, browserIsIos, browserSupportIgnored, canJoinUsingIosBrowser, isMobile, browserOsIsLegacy) =>
        !!(
            !browserSupportIgnored &&
            !canJoinUsingIosBrowser &&
            (browserIsIos ||
                /* not fully supported */ !(raw.webrtc && (isMobile || raw.screencapture) && raw.vp8) ||
                browserOsIsLegacy)
        )
);
