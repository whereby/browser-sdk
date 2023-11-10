import { LocalParticipant, RemoteParticipant, Screenshare, WaitingParticipant } from "./RoomParticipant";

import {
    ChatMessage as SignalChatMessage,
    CloudRecordingStartedEvent,
    KnockerLeftEvent,
    KnockAcceptedEvent,
    KnockRejectedEvent,
    RoomKnockedEvent as SignalRoomKnockedEvent,
    SignalClient,
    ScreenshareStartedEvent as SignalScreenshareStartedEvent,
    ScreenshareStoppedEvent as SignalScreenshareStoppedEvent,
} from "@whereby/jslib-media/src/utils/ServerSocket";
import { sdkVersion } from "./version";
import LocalMedia, { LocalMediaOptions } from "./LocalMedia";

type Logger = Pick<Console, "debug" | "error" | "log" | "warn" | "info">;
// new
import { RootState, createStore } from "./redux/store";
import { createServices } from "./services";
import { doAppJoin } from "./redux/slices/app";
import { selectRoomConnectionStatus } from "./redux/slices/roomConnection";
import {
    doRoomLeft,
    selectLocalParticipant,
    selectRemoteParticipants,
    selectWaitingParticipants,
} from "./redux/slices/room";
import { doSignalEnableAudio, doSignalEnableVideo, doSignalSendChatMessage } from "./redux/slices/signalConnection";
import { Unsubscribe } from "@reduxjs/toolkit";
import { selectChatMessages } from "./redux/slices/chat";

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
    startedAt: number;
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
    screenshare_started: (e: CustomEvent<ScreenshareStartedEvent>) => void;
    screenshare_stopped: (e: CustomEvent<ScreenshareStoppedEvent>) => void;
    streaming_started: (e: CustomEvent<LiveStreamState>) => void;
    streaming_stopped: (e: CustomEvent<LiveStreamState>) => void;
    waiting_participant_joined: (e: CustomEvent<WaitingParticipantJoinedEvent>) => void;
    waiting_participant_left: (e: CustomEvent<WaitingParticipantLeftEvent>) => void;
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
    public readonly localMediaConstraints?: MediaStreamConstraints;
    public readonly roomName: string;

    private connectionStatus: ConnectionStatus;
    private selfId: string | null;
    private logger: Logger;
    private _ownsLocalMedia = false;
    private displayName?: string;
    private externalId?: string;
    private _roomKey: string | null;
    // private _unsubscribe: Unsubscribe;
    // Redux
    private _store: ReturnType<typeof createStore>;
    private _state: RootState;

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
        this._state = this._store.getState();

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
                                    waitingParticipants: selectWaitingParticipants(state),
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

            const localParticipant = selectLocalParticipant(state);

            if (localParticipant !== this.localParticipant) {
                this.localParticipant = localParticipant;
            }

            const chatMessages = selectChatMessages(state);

            if (chatMessages !== this.chatMessages) {
                this.dispatchEvent(new RoomConnectionEvent("chat_messages_changed", { detail: chatMessages }));
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
            this._store.dispatch(doSignalEnableVideo({ enabled }));
            this.dispatchEvent(new RoomConnectionEvent("local_camera_enabled", { detail: { enabled } }));
        });
        this.localMedia.addEventListener("microphone_enabled", (e) => {
            const { enabled } = e.detail;
            this._store.dispatch(doSignalEnableAudio({ enabled }));
            this.dispatchEvent(new RoomConnectionEvent("local_microphone_enabled", { detail: { enabled } }));
        });
    }

    public get roomKey(): string | null {
        return this._roomKey;
    }

    private _handleCloudRecordingStarted(event: CloudRecordingStartedEvent) {
        // Only handle the start failure event here. The recording is
        // considered started when the recorder client joins.
        if (event.error) {
            this.dispatchEvent(
                new RoomConnectionEvent("cloud_recording_started_error", {
                    detail: { error: event.error, status: "error" },
                })
            );
        }
    }

    private _handleRecorderClientJoined({ client }: { client: SignalClient }) {
        this.dispatchEvent(
            new RoomConnectionEvent("cloud_recording_started", {
                detail: {
                    status: "recording",
                    startedAt: client.startedCloudRecordingAt
                        ? new Date(client.startedCloudRecordingAt).getTime()
                        : new Date().getTime(),
                },
            })
        );
    }

    private _handleStreamingStarted() {
        this.dispatchEvent(
            new RoomConnectionEvent("streaming_started", {
                detail: {
                    status: "streaming",
                    // We don't have the streaming start time stored on the
                    // server, so we use the current time instead. This gives
                    // an invalid timestamp for "Client B" if "Client A" has
                    // been streaming for a while before "Client B" joins.
                    startedAt: new Date().getTime(),
                },
            })
        );
    }

    private _handleKnockHandled(payload: KnockAcceptedEvent | KnockRejectedEvent) {
        const { clientId, resolution } = payload;

        // If the knocker is not the local participant, ignore the event
        if (clientId !== this.selfId) {
            return;
        }

        if (resolution === "accepted") {
            this._roomKey = payload.metadata.roomKey;
            // this._joinRoom();
        } else if (resolution === "rejected") {
            this.connectionStatus = "knock_rejected";

            this.dispatchEvent(
                new RoomConnectionEvent("connection_status_changed", {
                    detail: {
                        connectionStatus: this.connectionStatus,
                    },
                })
            );
        }
    }

    private _handleKnockerLeft(payload: KnockerLeftEvent) {
        const { clientId } = payload;

        this.dispatchEvent(
            new RoomConnectionEvent("waiting_participant_left", {
                detail: { participantId: clientId },
            })
        );
    }

    private _handleRoomKnocked(event: SignalRoomKnockedEvent) {
        const { clientId, displayName } = event;

        this.dispatchEvent(
            new RoomConnectionEvent("waiting_participant_joined", {
                detail: { participantId: clientId, displayName },
            })
        );
    }

    private _handleReconnect() {
        this.logger.log("Reconnected to signal socket");
        // this.signalSocket.emit("identify_device", { deviceCredentials: this._deviceCredentials });

        // this.signalSocket.once("device_identified", () => {
        // this._joinRoom();
        // });
    }

    private _handleDisconnect() {
        this.connectionStatus = "disconnected";
        this.dispatchEvent(
            new RoomConnectionEvent("connection_status_changed", {
                detail: {
                    connectionStatus: this.connectionStatus,
                },
            })
        );
    }

    private _handleCloudRecordingStopped() {
        this.dispatchEvent(new RoomConnectionEvent("cloud_recording_stopped"));
    }

    private _handleStreamingStopped() {
        this.dispatchEvent(new RoomConnectionEvent("streaming_stopped"));
    }

    private _handleScreenshareStarted(screenshare: SignalScreenshareStartedEvent) {
        const { clientId: participantId, streamId: id, hasAudioTrack } = screenshare;
        const remoteParticipant = this.remoteParticipants.find((p) => p.id === participantId);

        if (!remoteParticipant) {
            this.logger.log("WARN: Could not find participant for screenshare");
            return;
        }

        const foundScreenshare = this.screenshares.find((s) => s.id === id);
        if (foundScreenshare) {
            this.logger.log("WARN: Screenshare already exists");
            return;
        }

        remoteParticipant.addStream(id, "to_accept");
        // this._handleAcceptStreams([remoteParticipant]);

        this.screenshares = [
            ...this.screenshares,
            { participantId, id, hasAudioTrack, stream: undefined, isLocal: false },
        ];
    }

    private _handleScreenshareStopped(screenshare: SignalScreenshareStoppedEvent) {
        const { clientId: participantId, streamId: id } = screenshare;
        const remoteParticipant = this.remoteParticipants.find((p) => p.id === participantId);

        if (!remoteParticipant) {
            this.logger.log("WARN: Could not find participant for screenshare");
            return;
        }

        remoteParticipant.removeStream(id);
        this.screenshares = this.screenshares.filter((s) => !(s.participantId === participantId && s.id === id));
        this.dispatchEvent(new RoomConnectionEvent("screenshare_stopped", { detail: { participantId, id } }));
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
        this.connectionStatus = "knocking";
        this.dispatchEvent(
            new RoomConnectionEvent("connection_status_changed", {
                detail: {
                    connectionStatus: this.connectionStatus,
                },
            })
        );

        // this.signalSocket.emit("knock_room", {
        //     displayName: this.displayName,
        //     imageUrl: null,
        //     kickFromOtherRooms: true,
        //     liveVideo: false,
        //     organizationId: this.organizationId,
        //     roomKey: this._roomKey,
        //     roomName: this.roomName,
        //     externalId: this.externalId,
        // });
    }

    public leave() {
        // this.connectionStatus = "disconnecting";
        // if (this._ownsLocalMedia) {
        //     this.localMedia.stop();
        // }
        // if (this.rtcManager) {
        //     this.localMedia.removeRtcManager(this.rtcManager);
        //     this.rtcManager.disconnectAll();
        //     this.rtcManager = undefined;
        // }
        // if (!this.signalSocket) {
        //     return;
        // }
        // this.signalSocket.emit("leave_room");
        // this.signalSocket.disconnect();
        // this.connectionStatus = "disconnected";
        // this._store.dispatch(doRoomLeft());
        // console.log("leave");
        // console.log(this._store);
        // console.log(this._unsubscribe);
        // this._unsubscribe();
    }

    public sendChatMessage(text: string): void {
        this._store.dispatch(doSignalSendChatMessage({ text }));
    }

    public setDisplayName(displayName: string): void {
        // this.signalSocket.emit("send_client_metadata", {
        //     type: "UserData",
        //     payload: {
        //         displayName,
        //     },
        // });
    }

    public acceptWaitingParticipant(participantId: string) {
        // this.signalSocket.emit("handle_knock", {
        //     action: "accept",
        //     clientId: participantId,
        //     response: {},
        // });
    }

    public rejectWaitingParticipant(participantId: string) {
        // this.signalSocket.emit("handle_knock", {
        //     action: "reject",
        //     clientId: participantId,
        //     response: {},
        // });
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
        const screenshareStream = this.localMedia.screenshareStream || (await this.localMedia.startScreenshare());
        const onEnded = () => {
            this.stopScreenshare();
        };

        if ("oninactive" in screenshareStream) {
            // Chrome
            screenshareStream.addEventListener("inactive", onEnded);
        } else {
            // FF
            screenshareStream.getVideoTracks()[0]?.addEventListener("ended", onEnded);
        }

        // this.rtcManager?.addNewStream(screenshareStream.id, screenshareStream, false, true);
        this.screenshares = [
            ...this.screenshares,
            {
                participantId: this.selfId || "",
                id: screenshareStream.id,
                hasAudioTrack: false,
                stream: screenshareStream,
                isLocal: true,
            },
        ];

        this.dispatchEvent(
            new RoomConnectionEvent("screenshare_started", {
                detail: {
                    participantId: this.selfId || "",
                    id: screenshareStream.id,
                    hasAudioTrack: false,
                    stream: screenshareStream,
                    isLocal: true,
                },
            })
        );
    }

    public stopScreenshare() {
        if (this.localMedia.screenshareStream) {
            const { id } = this.localMedia.screenshareStream;

            // this.rtcManager?.removeStream(id, this.localMedia.screenshareStream, null);
            this.screenshares = this.screenshares.filter((s) => s.id !== id);
            this.dispatchEvent(
                new RoomConnectionEvent("screenshare_stopped", { detail: { participantId: this.selfId || "", id } })
            );
            this.localMedia.stopScreenshare();
        }
    }

    public startCloudRecording() {
        // this.signalSocket.emit("start_recording", {
        //     recording: "cloud",
        // });
        this.dispatchEvent(new RoomConnectionEvent("cloud_recording_request_started"));
    }

    public stopCloudRecording() {
        // this.signalSocket.emit("stop_recording");
    }
}
