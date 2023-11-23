import { LocalParticipant, RemoteParticipant, Screenshare, WaitingParticipant } from "../../RoomParticipant";

import { ChatMessage as SignalChatMessage } from "@whereby/jslib-media/src/utils/ServerSocket";
import { sdkVersion } from "../../version";
import LocalMedia, { LocalMediaOptions } from "../../LocalMedia";

type Logger = Pick<Console, "debug" | "error" | "log" | "warn" | "info">;
// new
import { createStore } from "./redux/store";
import { createServices } from "../../services";
import { doAppJoin } from "./redux/slices/app";
import { selectRoomConnectionStatus } from "./redux/slices/roomConnection";
import {
    doAcceptWaitingParticipant,
    doRejectWaitingParticipant,
    selectRemoteParticipants,
    //selectScreenshares,
    //selectWaitingParticipants,
} from "./redux/slices/remoteParticipants";
import { doSendChatMessage, selectChatMessages } from "./redux/slices/chat";
import {
    doEnableAudio,
    doEnableVideo,
    doSetDisplayName,
    doStartScreenshare,
    doStopScreenshare,
    selectLocalParticipantRaw,
} from "./redux/slices/localParticipant";
import { doStartCloudRecording, doStopCloudRecording, selectCloudRecordingRaw } from "./redux/slices/cloudRecording";
import { selectStreamingRaw } from "./redux/slices/streaming";

export interface RoomConnectionOptions {
    displayName?: string; // Might not be needed at all
    localMediaOptions?: LocalMediaOptions;
    roomKey?: string;
    logger?: Logger;
    localMedia?: LocalMedia;
    externalId?: string;
}

export type ChatMessage = Pick<SignalChatMessage, "senderId" | "timestamp" | "text">;
export type ConnectionStatus =
    | "initializing"
    | "connecting"
    | "connected"
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

export type RoomJoinedEvent = {
    localParticipant: LocalParticipant;
    remoteParticipants: RemoteParticipant[];
    waitingParticipants: WaitingParticipant[];
};

export type ConnectionStatusChangedEvent = {
    connectionStatus: ConnectionStatus;
};

export type ParticipantsChangedEvent = {
    remoteParticipants: RemoteParticipant[];
};

export type ScreenshareStartedEvent = {
    participantId: string;
    id: string;
    hasAudioTrack: boolean;
    stream: MediaStream;
    isLocal: boolean;
};

export type ScreenshareStoppedEvent = {
    participantId: string;
    id: string;
};

export type WaitingParticipantJoinedEvent = {
    participantId: string;
    displayName: string | null;
};

export type WaitingParticipantLeftEvent = {
    participantId: string;
};

export type LocalCameraEnabledEvent = {
    enabled: boolean;
};

export type LocalMicrophoneEnabledEvent = {
    enabled: boolean;
};

export interface RoomEventsMap {
    chat_messages_changed: (e: CustomEvent<ChatMessage[]>) => void;
    cloud_recording_request_started: (e: CustomEvent<CloudRecordingState>) => void;
    cloud_recording_started: (e: CustomEvent<CloudRecordingState>) => void;
    cloud_recording_started_error: (e: CustomEvent<CloudRecordingState>) => void;
    cloud_recording_stopped: (e: CustomEvent<CloudRecordingState>) => void;
    local_camera_enabled: (e: CustomEvent<LocalCameraEnabledEvent>) => void;
    local_microphone_enabled: (e: CustomEvent<LocalMicrophoneEnabledEvent>) => void;
    participants_changed: (e: CustomEvent<ParticipantsChangedEvent>) => void;
    connection_status_changed: (e: CustomEvent<ConnectionStatusChangedEvent>) => void;
    room_joined: (e: CustomEvent<RoomJoinedEvent>) => void;
    screenshares_changed: (e: CustomEvent<Screenshare[]>) => void;
    streaming_started: (e: CustomEvent<LiveStreamState>) => void;
    streaming_stopped: (e: CustomEvent<LiveStreamState>) => void;
    waiting_participants_changed: (e: CustomEvent<WaitingParticipant[]>) => void;
}

type ArgType<T> = T extends (arg: infer U) => unknown ? U : never;
type RoomEventKey = keyof RoomEventsMap;
type RoomEventHandler<T extends RoomEventKey> = RoomEventsMap[T];
type RoomEventType<T extends RoomEventKey> = ArgType<RoomEventHandler<T>>;
type RoomEventPayload<T extends RoomEventKey> = RoomEventType<T> extends CustomEvent<infer U> ? U : never;

export class RoomConnectionEvent<T extends RoomEventKey> extends CustomEvent<RoomEventPayload<T>> {
    constructor(eventType: T, eventInitDict?: CustomEventInit<RoomEventPayload<T>>) {
        super(eventType, eventInitDict);
    }
}

// cache last reported stream resolutions
const reportedStreamResolutions = new Map<string, { width: number; height: number }>();

/*
 * This is the topmost interface when dealing with Whereby.
 *
 */
interface RoomEventTarget extends EventTarget {
    addEventListener<K extends keyof RoomEventsMap>(
        type: K,
        listener: RoomEventsMap[K],
        options?: boolean | AddEventListenerOptions
    ): void;
    addEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: EventListenerOptions | boolean
    ): void;
    removeEventListener<K extends keyof RoomEventsMap>(
        type: K,
        listener: RoomEventsMap[K],
        options?: boolean | EventListenerOptions
    ): void;
    removeEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: EventListenerOptions | boolean
    ): void;
}

const noop = () => {
    return;
};

const TypedEventTarget = EventTarget as { new (): RoomEventTarget };
export default class RoomConnection extends TypedEventTarget {
    public localMedia: LocalMedia;
    public localParticipant?: LocalParticipant;
    public roomUrl: URL;
    public remoteParticipants: RemoteParticipant[] = [];
    public screenshares: Screenshare[] = [];
    public chatMessages: ChatMessage[] = [];
    public waitingParticipants: WaitingParticipant[] = [];
    public readonly localMediaConstraints?: MediaStreamConstraints;
    public readonly roomName: string;

    private connectionStatus: ConnectionStatus;
    private isRecording = false;
    private isStreaming = false;
    private selfId: string | null;
    private logger: Logger;
    private _ownsLocalMedia = false;
    private displayName?: string;
    private externalId?: string;
    private _roomKey: string | null;
    // private _unsubscribe: Unsubscribe;
    // Redux
    private _store: ReturnType<typeof createStore>;

    constructor(
        roomUrl: string,
        {
            displayName,
            localMedia,
            localMediaOptions: localMediaConstraints,
            logger,
            roomKey,
            externalId,
        }: RoomConnectionOptions
    ) {
        super();
        this.connectionStatus = "initializing";

        // redux
        this._store = createStore({
            injectServices: createServices(roomUrl),
        });

        // subscribe to redux store changes
        this._store.subscribe(() => {
            const state = this._store.getState();
            const connectionStatus = selectRoomConnectionStatus(state);

            if (connectionStatus !== this.connectionStatus) {
                this.connectionStatus = connectionStatus;
                this.dispatchEvent(
                    new RoomConnectionEvent("connection_status_changed", {
                        detail: {
                            connectionStatus: this.connectionStatus,
                        },
                    })
                );

                if (this.connectionStatus === "connected") {
                    if (this.localParticipant) {
                        this.dispatchEvent(
                            new RoomConnectionEvent("room_joined", {
                                detail: {
                                    localParticipant: this.localParticipant,
                                    remoteParticipants: this.remoteParticipants,
                                    waitingParticipants: [], //selectWaitingParticipants(state),
                                },
                            })
                        );
                    }
                }
            }

            const remoteParticipants = selectRemoteParticipants(state);

            if (remoteParticipants !== this.remoteParticipants) {
                this.remoteParticipants = remoteParticipants;
                this.dispatchEvent(
                    new RoomConnectionEvent("participants_changed", {
                        detail: {
                            remoteParticipants: this.remoteParticipants,
                        },
                    })
                );
            }

            const localParticipant = selectLocalParticipantRaw(state);

            if (localParticipant !== this.localParticipant) {
                this.localParticipant = localParticipant;
            }

            const chatMessages = selectChatMessages(state);

            if (chatMessages !== this.chatMessages) {
                this.dispatchEvent(new RoomConnectionEvent("chat_messages_changed", { detail: chatMessages }));
            }

            const waitingParticipants: WaitingParticipant[] = []; // selectWaitingParticipants(state);

            if (waitingParticipants !== this.waitingParticipants) {
                this.waitingParticipants = waitingParticipants;
                this.dispatchEvent(
                    new RoomConnectionEvent("waiting_participants_changed", {
                        detail: this.waitingParticipants,
                    })
                );
            }

            const screenshares: Screenshare[] = []; //selectScreenshares(state);

            if (screenshares !== this.screenshares) {
                this.screenshares = screenshares;
                this.dispatchEvent(
                    new RoomConnectionEvent("screenshares_changed", {
                        detail: this.screenshares,
                    })
                );
            }

            const cloudRecording = selectCloudRecordingRaw(state);

            if (cloudRecording.isRecording !== this.isRecording) {
                this.isRecording = cloudRecording.isRecording;

                if (this.isRecording) {
                    this.dispatchEvent(
                        new RoomConnectionEvent("cloud_recording_started", {
                            detail: {
                                status: "recording",
                                startedAt: cloudRecording.startedAt,
                            },
                        })
                    );
                } else {
                    this.dispatchEvent(new RoomConnectionEvent("cloud_recording_stopped"));
                }
            }

            const streaming = selectStreamingRaw(state);

            if (streaming.isStreaming !== this.isStreaming) {
                this.isStreaming = streaming.isStreaming;

                if (this.isStreaming) {
                    this.dispatchEvent(
                        new RoomConnectionEvent("streaming_started", {
                            detail: {
                                status: "streaming",
                                startedAt: streaming.startedAt,
                            },
                        })
                    );
                } else {
                    this.dispatchEvent(new RoomConnectionEvent("streaming_stopped"));
                }
            }
        });

        this.selfId = null;
        this.roomUrl = new URL(roomUrl); // Throw if invalid Whereby room url
        const searchParams = new URLSearchParams(this.roomUrl.search);
        this._roomKey = roomKey || searchParams.get("roomKey");
        this.roomName = this.roomUrl.pathname;
        this.logger = logger || {
            debug: noop,
            error: noop,
            info: noop,
            log: noop,
            warn: noop,
        };
        this.displayName = displayName;
        this.externalId = externalId;
        this.localMediaConstraints = localMediaConstraints;

        // Set up local media
        if (localMedia) {
            this.localMedia = localMedia;
        } else if (localMediaConstraints) {
            this.localMedia = new LocalMedia(localMediaConstraints);
            this._ownsLocalMedia = true;
        } else {
            throw new Error("Missing constraints");
        }

        // Set up local media listeners
        this.localMedia.addEventListener("camera_enabled", (e) => {
            const { enabled } = e.detail;
            this._store.dispatch(doEnableVideo({ enabled }));
            this.dispatchEvent(new RoomConnectionEvent("local_camera_enabled", { detail: { enabled } }));
        });
        this.localMedia.addEventListener("microphone_enabled", (e) => {
            const { enabled } = e.detail;
            this._store.dispatch(doEnableAudio({ enabled }));
            this.dispatchEvent(new RoomConnectionEvent("local_microphone_enabled", { detail: { enabled } }));
        });
    }

    public get roomKey(): string | null {
        return this._roomKey;
    }

    public async join() {
        this._store.dispatch(
            doAppJoin({
                roomName: this.roomName,
                roomKey: this._roomKey,
                displayName: this.displayName || "Guest",
                sdkVersion: sdkVersion || "unknown",
                localMedia: this.localMedia,
            })
        );
    }

    public knock() {
        //this._store.dispatch(doSignalKnock());
    }

    public leave() {
        // this._store.dispatch(doRoomLeft());
        // this._unsubscribe();
    }

    public sendChatMessage(text: string): void {
        this._store.dispatch(doSendChatMessage({ text }));
    }

    public setDisplayName(displayName: string): void {
        this._store.dispatch(doSetDisplayName({ displayName }));
    }

    public acceptWaitingParticipant(participantId: string) {
        this._store.dispatch(doAcceptWaitingParticipant({ participantId }));
    }

    public rejectWaitingParticipant(participantId: string) {
        this._store.dispatch(doRejectWaitingParticipant({ participantId }));
    }

    public updateStreamResolution({ streamId, width, height }: { streamId?: string; width: number; height: number }) {
        // if (!streamId || !this.rtcManager) {
        //     return;
        // }
        // no need to report resolution for local participant
        if (this.localParticipant?.stream?.id === streamId) {
            return;
        }

        // const old = reportedStreamResolutions.get(streamId);
        // if (!old || old.width !== width || old.height !== height) {
        // this.rtcManager.updateStreamResolution(streamId, null, { width: width || 1, height: height || 1 });
        // }
        // reportedStreamResolutions.set(streamId, { width, height });
    }

    public async startScreenshare() {
        this._store.dispatch(doStartScreenshare());
    }

    public stopScreenshare() {
        this._store.dispatch(doStopScreenshare());
    }

    public startCloudRecording() {
        this._store.dispatch(doStartCloudRecording());
        this.dispatchEvent(new RoomConnectionEvent("cloud_recording_request_started"));
    }

    public stopCloudRecording() {
        this._store.dispatch(doStopCloudRecording());
    }
}
