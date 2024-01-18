import { ActionCreatorWithPayload, PayloadAction, createSlice, isAnyOf } from "@reduxjs/toolkit";
import { AsyncThunkFulfilledActionCreator } from "@reduxjs/toolkit/dist/createAsyncThunk";
import { RootState } from "../store";
import { ThunkConfig, createAppThunk } from "../thunk";
import { createReactor, startAppListening } from "../listenerMiddleware";
import { selectRtcConnectionRaw, selectRtcManagerInitialized, selectRtcStatus } from "./rtcConnection";
import { selectAppDisplayName, selectAppExternalId } from "./app";
import { selectOrganizationId } from "./organization";
import {
    doEnableAudio,
    doEnableVideo,
    doSetDisplayName,
    selectLocalParticipantRole,
    selectSelfId,
} from "./localParticipant";
import { selectSignalStatus } from "./signalConnection";
import { selectDeviceId } from "./deviceCredentials";
import { doSetDevice, selectIsCameraEnabled, selectIsMicrophoneEnabled, selectLocalMediaStream } from "./localMedia";
import { doStartScreenshare, selectLocalScreenshareStream, stopScreenshare } from "./localScreenshare";
import { selectRoomConnectionSessionId } from "./roomConnection";

type RtcAnalyticsCustomEvent = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: ActionCreatorWithPayload<any> | AsyncThunkFulfilledActionCreator<any, any, ThunkConfig> | null;
    rtcEventName: string;
    getValue: (state: RootState) => unknown;
    getOutput: (value: unknown) => unknown;
};

export const rtcAnalyticsCustomEvents: { [key: string]: RtcAnalyticsCustomEvent } = {
    audioEnabled: {
        action: doEnableAudio.fulfilled,
        rtcEventName: "audioEnabled",
        getValue: (state: RootState) => selectIsMicrophoneEnabled(state),
        getOutput: (value) => ({ enabled: value }),
    },
    videoEnabled: {
        action: doEnableVideo.fulfilled,
        rtcEventName: "videoEnabled",
        getValue: (state: RootState) => selectIsCameraEnabled(state),
        getOutput: (value) => ({ enabled: value }),
    },
    localStream: {
        action: doSetDevice.fulfilled,
        rtcEventName: "localStream",
        getValue: (state: RootState) =>
            selectLocalMediaStream(state)
                ?.getTracks()
                .map((track) => ({ id: track.id, kind: track.kind, label: track.label })),
        getOutput: (value) => ({ stream: value }),
    },
    localScreenshareStream: {
        action: doStartScreenshare.fulfilled,
        rtcEventName: "localScreenshareStream",
        getValue: (state: RootState) =>
            selectLocalScreenshareStream(state)
                ?.getTracks()
                .map((track) => ({ id: track.id, kind: track.kind, label: track.label })),
        getOutput: (value) => ({ tracks: value }),
    },
    localScreenshareStreamStopped: {
        action: stopScreenshare,
        rtcEventName: "localScreenshareStream",
        getValue: () => () => null,
        getOutput: () => ({}),
    },
    displayName: {
        action: doSetDisplayName.fulfilled,
        rtcEventName: "displayName",
        getValue: (state: RootState) => selectAppDisplayName(state),
        getOutput: (value) => ({ displayName: value }),
    },
    clientId: {
        action: null,
        rtcEventName: "clientId",
        getValue: (state: RootState) => selectSelfId(state),
        getOutput: (value) => ({ clientId: value }),
    },
    deviceId: {
        action: null,
        rtcEventName: "deviceId",
        getValue: (state: RootState) => selectDeviceId(state),
        getOutput: (value) => ({ deviceId: value }),
    },
    externalId: {
        action: null,
        rtcEventName: "externalId",
        getValue: (state: RootState) => selectAppExternalId(state),
        getOutput: (value) => ({ externalId: value }),
    },
    organizationId: {
        action: null,
        rtcEventName: "organizationId",
        getValue: (state: RootState) => selectOrganizationId(state),
        getOutput: (value) => ({ organizationId: value }),
    },
    signalConnectionStatus: {
        action: null,
        rtcEventName: "signalConnectionStatus",
        getValue: (state: RootState) => selectSignalStatus(state),
        getOutput: (value) => ({ status: value }),
    },
    roomSessionId: {
        action: null,
        rtcEventName: "roomSessionId",
        getValue: (state: RootState) => selectRoomConnectionSessionId(state),
        getOutput: (value) => ({ roomSessionId: value }),
    },
    rtcConnectionStatus: {
        action: null,
        rtcEventName: "rtcConnectionStatus",
        getValue: (state: RootState) => selectRtcStatus(state),
        getOutput: (value) => ({ status: value }),
    },
    userRole: {
        action: null,
        rtcEventName: "userRole",
        getValue: (state: RootState) => selectLocalParticipantRole(state),
        getOutput: (value) => ({ userRole: value }),
    },
};

const rtcCustomEventActions = Object.values(rtcAnalyticsCustomEvents)
    .map(({ action }) => action)
    .filter(
        (
            action
        ): action is
            | ActionCreatorWithPayload<unknown, string>
            | AsyncThunkFulfilledActionCreator<unknown, unknown, ThunkConfig> => action !== null
    );

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
            return {
                ...state,
                reportedValues: {
                    ...state.reportedValues,
                    [action.payload.rtcEventName]: action.payload.value,
                },
            };
        },
    },
});

export const doRtcAnalyticsCustomEventsInitialize = createAppThunk(() => (dispatch, getState) => {
    const state = getState();
    const rtcManager = selectRtcConnectionRaw(state).rtcManager;

    if (!rtcManager) return;

    // RTC stats require a `insightsStats` event to be sent to set the timestamp.
    // This is a temporary workaround, we just send one dummy event on initialization.
    rtcManager.sendStatsCustomEvent("insightsStats", {
        _time: Date.now(),
        ls: 0,
        lr: 0,
        bs: 0,
        br: 0,
        cpu: 0,
    });

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
    matcher: isAnyOf(...rtcCustomEventActions),
    effect: ({ type }, { getState, dispatch }) => {
        const state: RootState = getState();

        const rtcManager = selectRtcConnectionRaw(state).rtcManager;
        if (!rtcManager) return;

        const rtcCustomEvent = Object.values(rtcAnalyticsCustomEvents).find(({ action }) => action?.type === type);
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
