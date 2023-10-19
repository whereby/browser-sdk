import RtcManagerDispatcher, {
    RtcEvents,
    RtcManagerCreatedPayload,
    RtcStreamAddedPayload,
} from "@whereby/jslib-media/src/webrtc/RtcManagerDispatcher";
import RtcManager from "@whereby/jslib-media/src/webrtc/RtcManager";
import { fromLocation } from "@whereby/jslib-media/src/utils/urls";
import {
    ApiClient,
    Credentials,
    CredentialsService,
    OrganizationApiClient,
    OrganizationService,
    OrganizationServiceCache,
    RoomService,
} from "./api";

import { LocalParticipant, RemoteParticipant, Screenshare, StreamState, WaitingParticipant } from "./RoomParticipant";

import ServerSocket, {
    ChatMessage as SignalChatMessage,
    ClientLeftEvent,
    ClientMetadataReceivedEvent,
    KnockerLeftEvent,
    KnockAcceptedEvent,
    KnockRejectedEvent,
    NewClientEvent,
    RoomJoinedEvent as SignalRoomJoinedEvent,
    RoomKnockedEvent as SignalRoomKnockedEvent,
    SignalClient,
    SocketManager,
    ScreenshareStartedEvent as SignalScreenshareStartedEvent,
    ScreenshareStoppedEvent as SignalScreenshareStoppedEvent,
} from "@whereby/jslib-media/src/utils/ServerSocket";
import { sdkVersion } from "./index";
import LocalMedia from "./LocalMedia";

type Logger = Pick<Console, "debug" | "error" | "log" | "warn">;

export interface RoomConnectionOptions {
    displayName?: string; // Might not be needed at all
    localMediaConstraints?: MediaStreamConstraints;
    roomKey?: string;
    logger?: Logger;
    localMedia?: LocalMedia;
    externalId?: string;
}

export type ChatMessage = Pick<SignalChatMessage, "senderId" | "timestamp" | "text">;
export type RoomConnectionStatus =
    | ""
    | "connecting"
    | "connected"
    | "room_locked"
    | "knocking"
    | "disconnecting"
    | "disconnected"
    | "accepted"
    | "rejected";

export type CloudRecordingState = {
    status: "" | "recording";
    startedAt: number | null;
};

export type StreamingState = {
    status: "" | "streaming";
    startedAt: number | null;
};

export type RoomJoinedEvent = {
    localParticipant: LocalParticipant;
    remoteParticipants: RemoteParticipant[];
    waitingParticipants: WaitingParticipant[];
};

export type RoomConnectionStatusChangedEvent = {
    roomConnectionStatus: RoomConnectionStatus;
};

export type ParticipantJoinedEvent = {
    remoteParticipant: RemoteParticipant;
};

export type ParticipantLeftEvent = {
    participantId: string;
};

export type ParticipantStreamAddedEvent = {
    participantId: string;
    stream: MediaStream;
};

export type ParticipantAudioEnabledEvent = {
    participantId: string;
    isAudioEnabled: boolean;
};

export type ParticipantVideoEnabledEvent = {
    participantId: string;
    isVideoEnabled: boolean;
};

export type ParticipantMetadataChangedEvent = {
    participantId: string;
    displayName: string;
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

export interface RoomEventsMap {
    chat_message: (e: CustomEvent<ChatMessage>) => void;
    cloud_recording_started: (e: CustomEvent<CloudRecordingState>) => void;
    cloud_recording_stopped: (e: CustomEvent<CloudRecordingState>) => void;
    participant_audio_enabled: (e: CustomEvent<ParticipantAudioEnabledEvent>) => void;
    participant_joined: (e: CustomEvent<ParticipantJoinedEvent>) => void;
    participant_left: (e: CustomEvent<ParticipantLeftEvent>) => void;
    participant_metadata_changed: (e: CustomEvent<ParticipantMetadataChangedEvent>) => void;
    participant_stream_added: (e: CustomEvent<ParticipantStreamAddedEvent>) => void;
    participant_video_enabled: (e: CustomEvent<ParticipantVideoEnabledEvent>) => void;
    room_connection_status_changed: (e: CustomEvent<RoomConnectionStatusChangedEvent>) => void;
    room_joined: (e: CustomEvent<RoomJoinedEvent>) => void;
    screenshare_started: (e: CustomEvent<ScreenshareStartedEvent>) => void;
    screenshare_stopped: (e: CustomEvent<ScreenshareStoppedEvent>) => void;
    streaming_started: (e: CustomEvent<StreamingState>) => void;
    streaming_stopped: (e: CustomEvent<StreamingState>) => void;
    waiting_participant_joined: (e: CustomEvent<WaitingParticipantJoinedEvent>) => void;
    waiting_participant_left: (e: CustomEvent<WaitingParticipantLeftEvent>) => void;
}

const API_BASE_URL = process.env["REACT_APP_API_BASE_URL"] || "https://api.whereby.dev";
const SIGNAL_BASE_URL = process.env["REACT_APP_SIGNAL_BASE_URL"] || "wss://signal.appearin.net";

const NON_PERSON_ROLES = ["recorder", "streamer"];

// cache last reported stream resolutions
const reportedStreamResolutions = new Map<string, { width: number; height: number }>();

function createSocket() {
    const parsedUrl = new URL(SIGNAL_BASE_URL);
    const path = `${parsedUrl.pathname.replace(/^\/$/, "")}/protocol/socket.io/v4`;
    const SOCKET_HOST = parsedUrl.origin;

    const socketConf = {
        autoConnect: false,
        host: SOCKET_HOST,
        path,
        reconnectionDelay: 5000,
        reconnectionDelayMax: 30000,
        timeout: 10000,
        withCredentials: true,
    };

    return new ServerSocket(SOCKET_HOST, socketConf);
}

export function handleStreamAdded(
    remoteParticipants: RemoteParticipant[],
    { clientId, stream, streamId, streamType }: RtcStreamAddedPayload
) {
    if (!streamId) {
        streamId = stream.id;
    }
    const remoteParticipant = remoteParticipants.find((p) => p.id === clientId);
    if (!remoteParticipant) {
        return;
    }

    const remoteParticipantStream =
        remoteParticipant.streams.find((s) => s.id === streamId) || remoteParticipant.streams[0];

    if (
        (remoteParticipant.stream && remoteParticipant.stream.id === streamId) ||
        (!remoteParticipant.stream && streamType === "webcam") ||
        (!remoteParticipant.stream && !streamType && remoteParticipant.streams.indexOf(remoteParticipantStream) < 1)
    ) {
        return new CustomEvent("participant_stream_added", { detail: { participantId: clientId, stream, streamId } });
    }
    // screenshare
    return new CustomEvent("screenshare_started", {
        detail: { participantId: clientId, stream, id: streamId, isLocal: false },
    });
}

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
    public localParticipant: LocalParticipant | null = null;
    public roomUrl: URL;
    public remoteParticipants: RemoteParticipant[] = [];
    public screenshares: Screenshare[] = [];
    public readonly localMediaConstraints?: MediaStreamConstraints;
    public readonly roomName: string;
    private organizationId: string;

    private credentialsService: CredentialsService;
    private apiClient: ApiClient;
    private organizationService: OrganizationService;
    private organizationServiceCache: OrganizationServiceCache;
    private organizationApiClient: OrganizationApiClient;
    private roomService: RoomService;

    private _deviceCredentials: Credentials | null = null;
    private signalSocket: ServerSocket;
    private signalSocketManager: SocketManager;
    private rtcManagerDispatcher?: RtcManagerDispatcher;
    private rtcManager?: RtcManager;
    private roomConnectionStatus: RoomConnectionStatus;
    private selfId: string | null;
    private logger: Logger;
    private _ownsLocalMedia = false;
    private displayName?: string;
    private externalId?: string;
    private _roomKey: string | null;

    constructor(
        roomUrl: string,
        { displayName, localMedia, localMediaConstraints, logger, roomKey, externalId }: RoomConnectionOptions
    ) {
        super();
        this.organizationId = "";
        this.roomConnectionStatus = "";
        this.selfId = null;
        this.roomUrl = new URL(roomUrl); // Throw if invalid Whereby room url
        const searchParams = new URLSearchParams(this.roomUrl.search);
        this._roomKey = roomKey || searchParams.get("roomKey");
        this.roomName = this.roomUrl.pathname;
        this.logger = logger || {
            debug: noop,
            error: noop,
            log: noop,
            warn: noop,
        };
        this.displayName = displayName;
        this.externalId = externalId;
        this.localMediaConstraints = localMediaConstraints;
        const urls = fromLocation({ host: this.roomUrl.host });

        // Set up local media
        if (localMedia) {
            this.localMedia = localMedia;
        } else if (localMediaConstraints) {
            this.localMedia = new LocalMedia(localMediaConstraints);
            this._ownsLocalMedia = true;
        } else {
            throw new Error("Missing constraints");
        }

        // Set up services
        this.credentialsService = CredentialsService.create({ baseUrl: API_BASE_URL });
        this.apiClient = new ApiClient({
            fetchDeviceCredentials: this.credentialsService.getCredentials.bind(this.credentialsService),
            baseUrl: API_BASE_URL,
        });
        this.organizationService = new OrganizationService({ apiClient: this.apiClient });
        this.organizationServiceCache = new OrganizationServiceCache({
            organizationService: this.organizationService,
            subdomain: urls.subdomain,
        });
        this.organizationApiClient = new OrganizationApiClient({
            apiClient: this.apiClient,
            fetchOrganization: async () => {
                const organization = await this.organizationServiceCache.fetchOrganization();
                return organization || undefined;
            },
        });
        this.roomService = new RoomService({ organizationApiClient: this.organizationApiClient });

        // Create signal socket and set up event listeners
        this.signalSocket = createSocket();
        this.signalSocket.on("new_client", this._handleNewClient.bind(this));
        this.signalSocket.on("chat_message", this._handleNewChatMessage.bind(this));
        this.signalSocket.on("client_left", this._handleClientLeft.bind(this));
        this.signalSocket.on("audio_enabled", this._handleClientAudioEnabled.bind(this));
        this.signalSocket.on("video_enabled", this._handleClientVideoEnabled.bind(this));
        this.signalSocket.on("client_metadata_received", this._handleClientMetadataReceived.bind(this));
        this.signalSocket.on("knock_handled", this._handleKnockHandled.bind(this));
        this.signalSocket.on("knocker_left", this._handleKnockerLeft.bind(this));
        this.signalSocket.on("room_joined", this._handleRoomJoined.bind(this));
        this.signalSocket.on("room_knocked", this._handleRoomKnocked.bind(this));
        this.signalSocket.on("cloud_recording_stopped", this._handleCloudRecordingStopped.bind(this));
        this.signalSocket.on("screenshare_started", this._handleScreenshareStarted.bind(this));
        this.signalSocket.on("screenshare_stopped", this._handleScreenshareStopped.bind(this));
        this.signalSocket.on("streaming_stopped", this._handleStreamingStopped.bind(this));
        this.signalSocket.on("disconnect", this._handleDisconnect.bind(this));
        this.signalSocket.on("connect_error", this._handleDisconnect.bind(this));

        this.signalSocketManager = this.signalSocket.getManager();
        this.signalSocketManager.on("reconnect", this._handleReconnect.bind(this));

        // Set up local media listeners
        this.localMedia.addEventListener("camera_enabled", (e) => {
            const { enabled } = e.detail;
            this.signalSocket.emit("enable_video", { enabled });
        });
        this.localMedia.addEventListener("microphone_enabled", (e) => {
            const { enabled } = e.detail;
            this.signalSocket.emit("enable_audio", { enabled });
        });

        const webrtcProvider = {
            getMediaConstraints: () => ({
                audio: this.localMedia.isMicrophoneEnabled(),
                video: this.localMedia.isCameraEnabled(),
            }),
            deferrable(clientId: string) {
                return !clientId;
            },
        };
        this.rtcManagerDispatcher = new RtcManagerDispatcher({
            emitter: {
                emit: this._handleRtcEvent.bind(this),
            },
            serverSocket: this.signalSocket,
            webrtcProvider,
            features: {
                lowDataModeEnabled: false,
                sfuServerOverrideHost: undefined,
                turnServerOverrideHost: undefined,
                useOnlyTURN: undefined,
                vp9On: false,
                h264On: false,
                simulcastScreenshareOn: false,
            },
        });
    }

    public get roomKey(): string | null {
        return this._roomKey;
    }

    private _handleNewChatMessage(message: SignalChatMessage) {
        this.dispatchEvent(new CustomEvent("chat_message", { detail: message }));
    }

    private _handleCloudRecordingStarted({ client }: { client: SignalClient }) {
        this.dispatchEvent(
            new CustomEvent("cloud_recording_started", {
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
            new CustomEvent("streaming_started", {
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

    private _handleNewClient({ client }: NewClientEvent) {
        if (client.role.roleName === "recorder") {
            this._handleCloudRecordingStarted({ client });
        }
        if (client.role.roleName === "streamer") {
            this._handleStreamingStarted();
        }
        if (NON_PERSON_ROLES.includes(client.role.roleName)) {
            return;
        }
        const remoteParticipant = new RemoteParticipant({ ...client, newJoiner: true });
        this.remoteParticipants = [...this.remoteParticipants, remoteParticipant];
        this._handleAcceptStreams([remoteParticipant]);
        this.dispatchEvent(new CustomEvent("participant_joined", { detail: { remoteParticipant } }));
    }

    private _handleClientLeft({ clientId }: ClientLeftEvent) {
        const remoteParticipant = this.remoteParticipants.find((p) => p.id === clientId);
        this.remoteParticipants = this.remoteParticipants.filter((p) => p.id !== clientId);
        if (!remoteParticipant) {
            return;
        }
        this.dispatchEvent(new CustomEvent("participant_left", { detail: { participantId: remoteParticipant.id } }));
    }

    private _handleClientAudioEnabled({ clientId, isAudioEnabled }: { clientId: string; isAudioEnabled: boolean }) {
        const remoteParticipant = this.remoteParticipants.find((p) => p.id === clientId);
        if (!remoteParticipant) {
            return;
        }
        this.dispatchEvent(
            new CustomEvent("participant_audio_enabled", {
                detail: { participantId: remoteParticipant.id, isAudioEnabled },
            })
        );
    }

    private _handleClientVideoEnabled({ clientId, isVideoEnabled }: { clientId: string; isVideoEnabled: boolean }) {
        const remoteParticipant = this.remoteParticipants.find((p) => p.id === clientId);
        if (!remoteParticipant) {
            return;
        }
        this.dispatchEvent(
            new CustomEvent("participant_video_enabled", {
                detail: { participantId: remoteParticipant.id, isVideoEnabled },
            })
        );
    }

    private _handleClientMetadataReceived({ payload: { clientId, displayName } }: ClientMetadataReceivedEvent) {
        const remoteParticipant = this.remoteParticipants.find((p) => p.id === clientId);
        if (!remoteParticipant) {
            return;
        }
        this.dispatchEvent(
            new CustomEvent("participant_metadata_changed", {
                detail: { participantId: remoteParticipant.id, displayName },
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
            this.roomConnectionStatus = "accepted";
            this._roomKey = payload.metadata.roomKey;
            this._joinRoom();
        } else if (resolution === "rejected") {
            this.roomConnectionStatus = "rejected";

            this.dispatchEvent(
                new CustomEvent("room_connection_status_changed", {
                    detail: {
                        roomConnectionStatus: this.roomConnectionStatus,
                    },
                })
            );
        }
    }

    private _handleKnockerLeft(payload: KnockerLeftEvent) {
        const { clientId } = payload;

        this.dispatchEvent(
            new CustomEvent("waiting_participant_left", {
                detail: { participantId: clientId },
            })
        );
    }

    private _handleRoomJoined(event: SignalRoomJoinedEvent) {
        const { error, isLocked, room, selfId } = event;
        this.selfId = selfId;
        if (error === "room_locked" && isLocked) {
            this.roomConnectionStatus = "room_locked";
            this.dispatchEvent(
                new CustomEvent("room_connection_status_changed", {
                    detail: {
                        roomConnectionStatus: this.roomConnectionStatus,
                    },
                })
            );
            return;
        }
        // Check if we have an error
        // Check if it is a room joined error
        // Set state to connect_failed_locked
        // Set state to connect_failed_no_host
        if (room) {
            const { clients, knockers } = room;

            const localClient = clients.find((c) => c.id === selfId);
            if (!localClient) throw new Error("Missing local client");

            this.localParticipant = new LocalParticipant({
                ...localClient,
                stream: this.localMedia.stream || undefined,
            });

            const recorderClient = clients.find((c) => c.role.roleName === "recorder");
            if (recorderClient) {
                this._handleCloudRecordingStarted({ client: recorderClient });
            }

            const streamerClient = clients.find((c) => c.role.roleName === "streamer");
            if (streamerClient) {
                this._handleStreamingStarted();
            }

            this.remoteParticipants = clients
                .filter((c) => c.id !== selfId)
                .filter((c) => !NON_PERSON_ROLES.includes(c.role.roleName))
                .map((c) => new RemoteParticipant({ ...c, newJoiner: false }));

            this.roomConnectionStatus = "connected";
            this.dispatchEvent(
                new CustomEvent("room_joined", {
                    detail: {
                        localParticipant: this.localParticipant,
                        remoteParticipants: this.remoteParticipants,
                        waitingParticipants: knockers.map((knocker) => {
                            return { id: knocker.clientId, displayName: knocker.displayName } as WaitingParticipant;
                        }),
                    },
                })
            );
        }
    }

    private _handleRoomKnocked(event: SignalRoomKnockedEvent) {
        const { clientId, displayName } = event;

        this.dispatchEvent(
            new CustomEvent("waiting_participant_joined", {
                detail: { participantId: clientId, displayName },
            })
        );
    }

    private _handleReconnect() {
        this.logger.log("Reconnected to signal socket");
        this.signalSocket.emit("identify_device", { deviceCredentials: this._deviceCredentials });

        this.signalSocket.once("device_identified", () => {
            this._joinRoom();
        });
    }

    private _handleDisconnect() {
        this.roomConnectionStatus = "disconnected";
        this.dispatchEvent(
            new CustomEvent("room_connection_status_changed", {
                detail: {
                    roomConnectionStatus: this.roomConnectionStatus,
                },
            })
        );
    }

    private _handleCloudRecordingStopped() {
        this.dispatchEvent(new CustomEvent("cloud_recording_stopped"));
    }

    private _handleStreamingStopped() {
        this.dispatchEvent(new CustomEvent("streaming_stopped"));
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
        this._handleAcceptStreams([remoteParticipant]);

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
        this.dispatchEvent(new CustomEvent("screenshare_stopped", { detail: { participantId, id } }));
    }

    private _handleRtcEvent<K extends keyof RtcEvents>(eventName: K, data: RtcEvents[K]) {
        if (eventName === "rtc_manager_created") {
            return this._handleRtcManagerCreated(data as RtcManagerCreatedPayload);
        } else if (eventName === "stream_added") {
            return this._handleStreamAdded(data as RtcStreamAddedPayload);
        } else if (eventName === "rtc_manager_destroyed") {
            return this._handleRtcManagerDestroyed();
        } else {
            this.logger.log(`Unhandled RTC event ${eventName}`);
        }
    }

    private _handleRtcManagerCreated({ rtcManager }: RtcManagerCreatedPayload) {
        this.rtcManager = rtcManager;
        this.localMedia.addRtcManager(rtcManager);

        if (this.localMedia.stream) {
            this.rtcManager?.addNewStream(
                "0",
                this.localMedia.stream,
                !this.localMedia.isMicrophoneEnabled(),
                !this.localMedia.isCameraEnabled()
            );
        }

        if (this.remoteParticipants.length) {
            this._handleAcceptStreams(this.remoteParticipants);
        }
    }

    private _handleRtcManagerDestroyed() {
        this.rtcManager = undefined;
    }

    private _handleAcceptStreams(remoteParticipants: RemoteParticipant[]) {
        if (!this.rtcManager) {
            this.logger.log("Unable to accept streams, no rtc manager");
            return;
        }

        const shouldAcceptNewClients = this.rtcManager.shouldAcceptStreamsFromBothSides?.();
        const activeBreakout = false; // TODO: Remove this once breakout is implemented
        const myselfBroadcasting = false; // TODO: Remove once breakout is implemented

        remoteParticipants.forEach((participant) => {
            const { id: participantId, streams, newJoiner } = participant;

            streams.forEach((stream) => {
                const { id: streamId, state: streamState } = stream;
                let newState: StreamState | undefined = undefined;

                // Determine the new state of the client, equivalent of "reactAcceptStreams"
                // TODO: Replace this with correct logic catering for breakouts etc

                const isInSameRoomOrGroupOrClientBroadcasting = true; // TODO: Remove once breakout is implemented

                if (isInSameRoomOrGroupOrClientBroadcasting) {
                    if (streamState !== "done_accept") {
                        newState = `${newJoiner && streamId === "0" ? "new" : "to"}_accept`;
                    }
                } else if (myselfBroadcasting) {
                    if (streamState !== "done_accept") {
                        newState = `${newJoiner && streamId === "0" ? "done" : "old"}_accept`;
                    }
                } else {
                    if (streamState !== "done_unaccept") {
                        newState = "to_unaccept";
                    }
                }

                if (!newState) {
                    return;
                }

                if (
                    newState === "to_accept" ||
                    (newState === "new_accept" && shouldAcceptNewClients) ||
                    (newState === "old_accept" && !shouldAcceptNewClients)
                ) {
                    this.logger.log(`Accepting stream ${streamId} from ${participantId}`);
                    this.rtcManager?.acceptNewStream({
                        streamId: streamId === "0" ? participantId : streamId,
                        clientId: participantId,
                        shouldAddLocalVideo: streamId === "0",
                        activeBreakout,
                    });
                } else if (newState === "new_accept" || newState === "old_accept") {
                    // do nothing - let this be marked as done_accept as the rtcManager
                    // will trigger accept from other end
                } else if (newState === "to_unaccept") {
                    this.logger.log(`Disconnecting stream ${streamId} from ${participantId}`);
                    this.rtcManager?.disconnect(streamId === "0" ? participantId : streamId, activeBreakout);
                } else if (newState !== "done_accept") {
                    this.logger.warn(`Stream state not handled: ${newState} for ${participantId}-${streamId}`);
                    return;
                } else {
                    // done_accept
                }

                // Update stream state
                participant.updateStreamState(streamId, streamState.replace(/to_|new_|old_/, "done_") as StreamState);
            });
        });
    }

    private _handleStreamAdded(args: RtcStreamAddedPayload) {
        const streamAddedEvent = handleStreamAdded(this.remoteParticipants, args);
        if (streamAddedEvent) {
            this.dispatchEvent(streamAddedEvent);
        }
    }

    private _joinRoom() {
        this.signalSocket.emit("join_room", {
            avatarUrl: null,
            config: {
                isAudioEnabled: this.localMedia.isMicrophoneEnabled(),
                isVideoEnabled: this.localMedia.isCameraEnabled(),
            },
            deviceCapabilities: { canScreenshare: true },
            displayName: this.displayName,
            isCoLocated: false,
            isDevicePermissionDenied: false,
            kickFromOtherRooms: false,
            organizationId: this.organizationId,
            roomKey: this.roomKey,
            roomName: this.roomName,
            selfId: "",
            userAgent: `browser-sdk:${sdkVersion || "unknown"}`,
            externalId: this.externalId,
        });
    }

    public async join() {
        if (["connected", "connecting"].includes(this.roomConnectionStatus)) {
            console.warn(`Trying to join when room state is already ${this.roomConnectionStatus}`);
            return;
        }

        this.signalSocket.connect();
        this.roomConnectionStatus = "connecting";
        this.dispatchEvent(
            new CustomEvent("room_connection_status_changed", {
                detail: {
                    roomConnectionStatus: this.roomConnectionStatus,
                },
            })
        );

        const organization = await this.organizationServiceCache.fetchOrganization();
        if (!organization) {
            throw new Error("Invalid room url");
        }
        this.organizationId = organization.organizationId;

        if (this._ownsLocalMedia) {
            await this.localMedia.start();
        }

        // Identify device on signal connection
        this._deviceCredentials = await this.credentialsService.getCredentials();

        this.logger.log("Connected to signal socket");
        this.signalSocket.emit("identify_device", { deviceCredentials: this._deviceCredentials });

        this.signalSocket.once("device_identified", () => {
            this._joinRoom();
        });
    }

    public knock() {
        this.roomConnectionStatus = "knocking";
        this.dispatchEvent(
            new CustomEvent("room_connection_status_changed", {
                detail: {
                    roomConnectionStatus: this.roomConnectionStatus,
                },
            })
        );

        this.signalSocket.emit("knock_room", {
            displayName: this.displayName,
            imageUrl: null,
            kickFromOtherRooms: true,
            liveVideo: false,
            organizationId: this.organizationId,
            roomKey: this._roomKey,
            roomName: this.roomName,
            externalId: this.externalId,
        });
    }

    public leave() {
        this.roomConnectionStatus = "disconnecting";
        if (this._ownsLocalMedia) {
            this.localMedia.stop();
        }

        if (this.rtcManager) {
            this.localMedia.removeRtcManager(this.rtcManager);
            this.rtcManager.disconnectAll();
            this.rtcManager = undefined;
        }

        if (!this.signalSocket) {
            return;
        }

        this.signalSocket.emit("leave_room");
        this.signalSocket.disconnect();
        this.roomConnectionStatus = "disconnected";
    }

    public sendChatMessage(text: string): void {
        this.signalSocket.emit("chat_message", {
            text,
        });
    }

    public setDisplayName(displayName: string): void {
        this.signalSocket.emit("send_client_metadata", {
            type: "UserData",
            payload: {
                displayName,
            },
        });
    }

    public acceptWaitingParticipant(participantId: string) {
        this.signalSocket.emit("handle_knock", {
            action: "accept",
            clientId: participantId,
            response: {},
        });
    }

    public rejectWaitingParticipant(participantId: string) {
        this.signalSocket.emit("handle_knock", {
            action: "reject",
            clientId: participantId,
            response: {},
        });
    }

    public updateStreamResolution({ streamId, width, height }: { streamId?: string; width: number; height: number }) {
        if (!streamId || !this.rtcManager) {
            return;
        }
        // no need to report resolution for local participant
        if (this.localParticipant?.stream?.id === streamId) {
            return;
        }

        const old = reportedStreamResolutions.get(streamId);
        if (!old || old.width !== width || old.height !== height) {
            this.rtcManager.updateStreamResolution(streamId, null, { width: width || 1, height: height || 1 });
        }
        reportedStreamResolutions.set(streamId, { width, height });
    }

    public async startScreenshare() {
        const screenshareStream = this.localMedia.screenshareStream || (await this.localMedia.startScreenshare());
        this.rtcManager?.addNewStream(screenshareStream.id, screenshareStream, false, true);
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
            new CustomEvent("screenshare_started", {
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

            this.rtcManager?.removeStream(id, this.localMedia.screenshareStream, null);
            this.screenshares = this.screenshares.filter((s) => s.id !== id);
            this.dispatchEvent(new CustomEvent("screenshare_stopped", { detail: { participantId: this.selfId, id } }));
            this.localMedia.stopScreenshare();
        }
    }
}
