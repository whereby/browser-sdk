import { createAction } from "@reduxjs/toolkit";

import {
    AudioEnabledEvent,
    ChatMessage,
    ClientLeftEvent,
    ClientMetadataReceivedEvent,
    CloudRecordingStartedEvent,
    KnockerLeftEvent,
    KnockAcceptedEvent,
    KnockRejectedEvent,
    NewClientEvent,
    RoomJoinedEvent,
    RoomKnockedEvent,
    ScreenshareStartedEvent,
    ScreenshareStoppedEvent,
    VideoEnabledEvent,
    RoomSessionEndedEvent,
} from "@whereby/jslib-media/src/utils/ServerSocket";

function createSignalEventAction<T>(name: string) {
    return createAction<T>(`signalConnection/event/${name}`);
}

export const signalEvents = {
    audioEnabled: createSignalEventAction<AudioEnabledEvent>("audioEnabled"),
    chatMessage: createSignalEventAction<ChatMessage>("chatMessage"),
    clientLeft: createSignalEventAction<ClientLeftEvent>("clientLeft"),
    clientMetadataReceived: createSignalEventAction<ClientMetadataReceivedEvent>("clientMetadataReceived"),
    cloudRecordingStarted: createSignalEventAction<CloudRecordingStartedEvent>("cloudRecordingStarted"),
    cloudRecordingStopped: createSignalEventAction<void>("cloudRecordingStopped"),
    disconnect: createSignalEventAction<void>("disconnect"),
    knockerLeft: createSignalEventAction<KnockerLeftEvent>("knockerLeft"),
    knockHandled: createSignalEventAction<KnockAcceptedEvent | KnockRejectedEvent>("knockHandled"),
    newClient: createSignalEventAction<NewClientEvent>("newClient"),
    roomJoined: createSignalEventAction<RoomJoinedEvent>("roomJoined"),
    roomKnocked: createSignalEventAction<RoomKnockedEvent>("roomKnocked"),
    roomSessionEnded: createSignalEventAction<RoomSessionEndedEvent>("roomSessionEnded"),
    screenshareStarted: createSignalEventAction<ScreenshareStartedEvent>("screenshareStarted"),
    screenshareStopped: createSignalEventAction<ScreenshareStoppedEvent>("screenshareStopped"),
    streamingStopped: createSignalEventAction<void>("streamingStopped"),
    videoEnabled: createSignalEventAction<VideoEnabledEvent>("videoEnabled"),
};
