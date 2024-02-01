import { LocalParticipant, RemoteParticipant, Screenshare } from "../../core";

import { ChatMessage as SignalChatMessage } from "@whereby/jslib-media/src/utils/ServerSocket";
import { LocalMediaOptions } from "../../core/redux/slices/localMedia";
import { UseLocalMediaResult } from "../useLocalMedia/types";
import { Store } from "../../../lib/core/redux/store";
import VideoView from "../VideoView";

export type RemoteParticipantState = Omit<RemoteParticipant, "newJoiner" | "streams">;
export type LocalParticipantState = LocalParticipant;
export interface WaitingParticipantState {
    id: string;
    displayName: string | null;
}
export interface ChatMessageState {
    senderId: string;
    timestamp: string;
    text: string;
}
export type ScreenshareState = Screenshare;

type LocalScreenshareStatus = "starting" | "active";

export type ChatMessage = Pick<SignalChatMessage, "senderId" | "timestamp" | "text">;
export type ConnectionStatus =
    | "initializing"
    | "connecting"
    | "connected"
    | "reconnect"
    | "room_locked"
    | "knocking"
    | "disconnecting"
    | "disconnected"
    | "knock_rejected";

export type CloudRecordingState = {
    error?: string;
    status: "recording" | "requested" | "error";
    startedAt?: number;
};

export type LiveStreamState = {
    status: "streaming";
    startedAt?: number;
};

export interface RoomConnectionState {
    chatMessages: ChatMessage[];
    cloudRecording?: CloudRecordingState;
    localScreenshareStatus?: LocalScreenshareStatus;
    localParticipant?: LocalParticipantState;
    remoteParticipants: RemoteParticipantState[];
    screenshares: Screenshare[];
    connectionStatus: ConnectionStatus;
    liveStream?: LiveStreamState;
    waitingParticipants: WaitingParticipantState[];
}

export interface RoomConnectionOptions {
    displayName?: string; // Might not be needed at all
    localMediaOptions?: LocalMediaOptions;
    roomKey?: string;
    localMedia?: UseLocalMediaResult;
    externalId?: string;
}

export interface UseRoomConnectionOptions extends Omit<RoomConnectionOptions, "localMedia"> {
    localMedia?: UseLocalMediaResult;
}

export interface RoomConnectionActions {
    sendChatMessage(text: string): void;
    knock(): void;
    setDisplayName(displayName: string): void;
    toggleCamera(enabled?: boolean): void;
    toggleMicrophone(enabled?: boolean): void;
    acceptWaitingParticipant(participantId: string): void;
    rejectWaitingParticipant(participantId: string): void;
    startCloudRecording(): void;
    startScreenshare(): void;
    stopCloudRecording(): void;
    stopScreenshare(): void;
}

export type VideoViewComponentProps = Omit<React.ComponentProps<typeof VideoView>, "onResize">;

interface RoomConnectionComponents {
    VideoView: (props: VideoViewComponentProps) => ReturnType<typeof VideoView>;
}

export type RoomConnectionRef = {
    state: RoomConnectionState;
    actions: RoomConnectionActions;
    components: RoomConnectionComponents;
    _ref: Store;
};
