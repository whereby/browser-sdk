import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { createAppThunk } from "../thunk";
import { createReactor, startAppListening } from "../listenerMiddleware";
import { selectRtcConnectionRaw, selectRtcManagerInitialized, selectRtcStatus } from "./rtcConnection";
import { selectAppDisplayName, selectAppExternalId } from "./app";
import { selectOrganizationId } from "./organization";
import { selectLocalParticipantRole, selectSelfId } from "./localParticipant";
import { selectSignalStatus } from "./signalConnection";
import { selectDeviceId } from "./deviceCredentials";
import { selectIsCameraEnabled, selectIsMicrophoneEnabled, selectLocalMediaStream } from "./localMedia";
import { selectLocalScreenshareStream } from "./localScreenshare";

type RtcAnalyticsCustomEvent = {
    actionType: string;
    rtcEventName: string;
    getValue: (state: RootState) => unknown;
    getOutput: (value: unknown) => unknown;
};

export const rtcAnalyticsCustomEvents: { [key: string]: RtcAnalyticsCustomEvent } = {
    audioEnabled: {
        actionType: "localParticipant/doEnableAudio/fulfilled",
        rtcEventName: "audioEnabled",
        getValue: (state: RootState) => selectIsMicrophoneEnabled(state),
        getOutput: (value) => ({ enabled: value }),
    },
    videoEnabled: {
        actionType: "localParticipant/doEnableVideo/fulfilled",
        rtcEventName: "videoEnabled",
        getValue: (state: RootState) => selectIsCameraEnabled(state),
        getOutput: (value) => ({ enabled: value }),
    },
    localStream: {
        actionType: "localMedia/reactSetDevice/fulfilled",
        rtcEventName: "localStream",
        getValue: (state: RootState) =>
            selectLocalMediaStream(state)
                ?.getTracks()
                .map((track) => ({ id: track.id, kind: track.kind, label: track.label })),
        getOutput: (value) => ({ stream: value }),
    },
    localScreenshareStream: {
        actionType: "localScreenshare/doStartScreenshare/fulfilled",
        rtcEventName: "localScreenshareStream",
        getValue: (state: RootState) =>
            selectLocalScreenshareStream(state)
                ?.getTracks()
                .map((track) => ({ id: track.id, kind: track.kind, label: track.label })),
        getOutput: (value) => ({ tracks: value }),
    },
    localScreenshareStreamStopped: {
        actionType: "localScreeenshare/stopScreenshare",
        rtcEventName: "localScreenshareStream",
        getValue: () => () => null,
        getOutput: () => ({}),
    },
    displayName: {
        actionType: "localParticipant/doSetDisplayName/fulfilled",
        rtcEventName: "displayName",
        getValue: (state: RootState) => selectAppDisplayName(state),
        getOutput: (value) => ({ displayName: value }),
    },
    clientId: {
        actionType: "",
        rtcEventName: "clientId",
        getValue: (state: RootState) => selectSelfId(state),
        getOutput: (value) => ({ clientId: value }),
    },
    deviceId: {
        actionType: "",
        rtcEventName: "deviceId",
        getValue: (state: RootState) => selectDeviceId(state),
        getOutput: (value) => ({ deviceId: value }),
    },
    externalId: {
        actionType: "",
        rtcEventName: "externalId",
        getValue: (state: RootState) => selectAppExternalId(state),
        getOutput: (value) => ({ externalId: value }),
    },
    organizationId: {
        actionType: "",
        rtcEventName: "organizationId",
        getValue: (state: RootState) => selectOrganizationId(state),
        getOutput: (value) => ({ organizationId: value }),
    },
    signalConnectionStatus: {
        actionType: "",
        rtcEventName: "signalConnectionStatus",
        getValue: (state: RootState) => selectSignalStatus(state),
        getOutput: (value) => ({ status: value }),
    },
    rtcConnectionStatus: {
        actionType: "",
        rtcEventName: "rtcConnectionStatus",
        getValue: (state: RootState) => selectRtcStatus(state),
        getOutput: (value) => ({ status: value }),
    },
    userRole: {
        actionType: "",
        rtcEventName: "userRole",
        getValue: (state: RootState) => selectLocalParticipantRole(state),
        getOutput: (value) => ({ userRole: value }),
    },
};

const makeComparable = (value: unknown) => {
    if (typeof value === "object") return JSON.stringify(value);

    return value;
};

/**
 * Reducer
 */

export interface rtcAnalyticsState {
    reportedValues: { [key: string]: unknown };
}

const initialState: rtcAnalyticsState = {
    reportedValues: {},
};

export const rtcAnalyticsSlice = createSlice({
    initialState,
    name: "rtcAnalytics",
    reducers: {
        updateReportedValues(state, action: PayloadAction<{ rtcEventName: string; value: unknown }>) {
            state.reportedValues[action.payload.rtcEventName] = action.payload.value;
        },
    },
});

export const doRtcAnalyticsCustomEventsInitialize = createAppThunk(() => (dispatch, getState) => {
    const state = getState();
    const rtcManager = selectRtcConnectionRaw(state).rtcManager;

    if (!rtcManager) return;

    Object.values(rtcAnalyticsCustomEvents).forEach(({ rtcEventName, getValue, getOutput }) => {
        const value = getValue(state);
        const output = { ...(getOutput(value) as Record<string, unknown>), _time: Date.now() };

        const comparableValue = makeComparable(value);

        if (state.rtcAnalytics.reportedValues?.[rtcEventName] !== comparableValue) {
            rtcManager.sendStatsCustomEvent(rtcEventName, output);
            dispatch(updateReportedValues({ rtcEventName, value }));
        }
    });
});

/**
 * Action creators
 */
export const { updateReportedValues } = rtcAnalyticsSlice.actions;

startAppListening({
    predicate: (_action) => {
        const rtcCustomEventActions = Object.values(rtcAnalyticsCustomEvents).map(({ actionType }) => actionType);

        const isRtcEvent = rtcCustomEventActions.includes(_action.type);

        return isRtcEvent;
    },
    effect: ({ type }, { getState, dispatch }) => {
        const state: RootState = getState();

        const rtcManager = selectRtcConnectionRaw(state).rtcManager;
        if (!rtcManager) return;

        const rtcCustomEvent = Object.values(rtcAnalyticsCustomEvents).find(({ actionType }) => actionType === type);
        if (!rtcCustomEvent) return;

        const { getValue, getOutput, rtcEventName } = rtcCustomEvent;

        const value = getValue(state);
        const comparableValue = makeComparable(value);
        const output = { ...(getOutput(value) as Record<string, unknown>), _time: Date.now() };

        if (state.rtcAnalytics.reportedValues?.[rtcEventName] !== comparableValue) {
            rtcManager.sendStatsCustomEvent(rtcEventName, output);
            dispatch(updateReportedValues({ rtcEventName, value }));
        }
    },
});

/**
 * Reactors
 */

createReactor([selectRtcManagerInitialized], ({ dispatch }, selectRtcManagerInitialized) => {
    if (selectRtcManagerInitialized) {
        dispatch(doRtcAnalyticsCustomEventsInitialize());
    }
});
