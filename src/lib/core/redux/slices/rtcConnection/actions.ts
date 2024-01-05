import { createAction } from "@reduxjs/toolkit";
import { RtcManagerCreatedPayload, RtcStreamAddedPayload } from "@whereby/jslib-media/src/webrtc/RtcManagerDispatcher";

import { RootState } from "../../store";
import {
    selectIsCameraEnabled,
    selectIsMicrophoneEnabled,
    selectLocalMediaStream,
    selectScreenshareStream,
} from "../localMedia";
import { selectAppDisplayName, selectAppExternalId } from "../app";
import { selectOrganizationId } from "../organization";
import { selectLocalParticipantUserRole, selectSelfId } from "../localParticipant";
import { selectSignalStatus } from "../signalConnection";
import { selectDeviceId } from "../deviceCredentials";

function createRtcEventAction<T>(name: string) {
    return createAction<T>(`rtcConnection/event/${name}`);
}

export const rtcEvents = {
    rtcManagerCreated: createRtcEventAction<RtcManagerCreatedPayload>("rtcManagerCreated"),
    rtcManagerDestroyed: createRtcEventAction<void>("rtcManagerDestroyed"),
    streamAdded: createRtcEventAction<RtcStreamAddedPayload>("streamAdded"),
};

type RtcAnalyticsCustomEvent = {
    actionType: string;
    rtcEventName: string;
    getValue: (state: RootState) => unknown;
    getOutput: (value: unknown) => unknown;
};

// type InitialRtcAnalyticsCustomEvent = Omit<RtcAnalyticsCustomEvent, "actionType">;

// TODO: consider separate type for ones without actions
export const initialRtcAnalyticsCustomEvents = {};

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
        actionType: "localMedia/doStartScreenshare/fulfilled",
        rtcEventName: "localScreenshareStream",
        getValue: (state: RootState) =>
            selectScreenshareStream(state)
                ?.getTracks()
                .map((track) => ({ id: track.id, kind: track.kind, label: track.label })),
        getOutput: (value) => ({ tracks: value }),
    },
    localScreenshareStreamStopped: {
        actionType: "localMedia/stopScreenshare",
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
    // rtcConnectionStatus: {
    //     // TODO: race condition with this one
    //     actionType: "",
    //     rtcEventName: "rtcConnectionStatus",
    //     getValue: (state: RootState) => selectRtcStatus(state),
    //     getOutput: () => ({}),
    // },
    userRole: {
        actionType: "",
        rtcEventName: "userRole",
        getValue: (state: RootState) => selectLocalParticipantUserRole(state),
        getOutput: (value) => ({ userRole: value }),
    },
};
