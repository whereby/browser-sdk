import { createAction } from "@reduxjs/toolkit";
import { RtcManagerCreatedPayload, RtcStreamAddedPayload } from "@whereby/jslib-media/src/webrtc/RtcManagerDispatcher";

function createRtcEventAction<T>(name: string) {
    return createAction<T>(`rtcConnection/event/${name}`);
}

export const rtcEvents = {
    rtcManagerCreated: createRtcEventAction<RtcManagerCreatedPayload>("rtcManagerCreated"),
    rtcManagerDestroyed: createRtcEventAction<void>("rtcManagerDestroyed"),
    streamAdded: createRtcEventAction<RtcStreamAddedPayload>("streamAdded"),
};
