import { createAction } from "@reduxjs/toolkit";
import { RtcManagerCreatedPayload, RtcStreamAddedPayload } from "@whereby/jslib-media/src/webrtc/RtcManagerDispatcher";

import { RootState } from "../../store";
import { selectIsCameraEnabled, selectIsMicrophoneEnabled, selectScreenshareStream } from "../localMedia";
import { selectAppDisplayName, selectAppExternalId } from "../app";
import { selectOrganizationId } from "../organization";
import { selectRtcStatus } from ".";
import { selectLocalParticipantRaw } from "../localParticipant";
import { selectRemoteParticipants } from "../remoteParticipants";

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
    externalId: {
        // TODO: this sends initially because it is null, not undefined
        actionType: "", // consider separate type for this
        rtcEventName: "externalId",
        getValue: (state: RootState) => selectAppExternalId(state),
        getOutput: (value) => ({ externalId: value }),
    },
    organizationId: {
        actionType: "",
        rtcEventName: "organizationId",
        getValue: (state: RootState) => selectOrganizationId(state),
        getOutput: () => ({}),
    },
    // rtcConnectionStatus: { // TODO: race condition with this one
    //     actionType: "",
    //     rtcEventName: "rtcConnectionStatus",
    //     getValue: (state: RootState) => selectRtcStatus(state),
    //     getOutput: () => ({}),
    // },
    // userRole: {
    //     actionType: "",
    //     rtcEventName: "userRole",
    //     getValue: (state: RootState) => selectRemoteParticipants(state),
    //     getOutput: () => ({}),
    // },
};

// Events to track
// rtcAnalytics
// audioEnabled ✅
// videoEnabled ✅
// breakoutGroup ❌
// colocation ❌
// signalConnectionStatus
// rtcConnectionStatus
// cameraEffects
// localStream
// localScreenshareStream ✅
// displayName ✅
// deviceId
// clientId
// roomSessionId
// organizationId ✅
// recording
// streaming
// userRole
// externalId ✅
