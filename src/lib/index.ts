import "./embed";
export { useLocalMedia, useRoomConnection, VideoView } from "./react";
export { default as fakeWebcamFrame } from "./utils/fakeWebcamFrame";
export { default as fakeAudioStream } from "./utils/fakeAudioStream";
export type {
    RemoteParticipantState as RemoteParticipant,
    LocalParticipantState as LocalParticipant,
    WaitingParticipant,
    Screenshare,
} from "./RoomParticipant";
export type { ChatMessage } from "./RoomConnection";
export const sdkVersion = "__SDK_VERSION__";
