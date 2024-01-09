import { createAction } from "@reduxjs/toolkit";
import { RtcManagerCreatedPayload, RtcStreamAddedPayload } from "@whereby/jslib-media/src/webrtc/RtcManagerDispatcher";

import { RootState } from "../../store";
import { selectIsCameraEnabled, selectIsMicrophoneEnabled, selectScreenshareStream } from "../localMedia";
import { selectAppDisplayName } from "../app";

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
};
