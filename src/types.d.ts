declare module "heresy" {
    interface AttrChanged {
        attributeName: string;
        oldValue: string | boolean;
    }

    interface element {
        observedAttributes?: string[];
        onattributechanged?: (attrChanged: AttrChanged) => void;
        onconnected?: () => void;
        ondisconnected?: () => void;
        oninit?: () => void;
        render: () => void;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [x: string]: any;
    }

    export function define(elementName: string, element: element): void;
    export function ref(): boolean;
}

declare module "@whereby/jslib-media/src/webrtc/RtcManagerDispatcher" {
    import { type HandlerFactory } from "mediasoup-client/lib/handlers/HandlerInterface";
    enum RtcEventNames {
        rtc_manager_created = "rtc_manager_created",
        stream_added = "stream_added",
    }

    interface RtcManagerCreatedPayload {
        rtcManager: RtcManager;
    }

    interface RtcStreamAddedPayload {
        clientId: string;
        stream: MediaStream;
        streamId: string | undefined;
        streamType: "webcam" | "screenshare" | undefined;
    }

    type RtcEvents = {
        rtc_manager_created: RtcManagerCreatedPayload;
        rtc_manager_destroyed: void;
        stream_added: RtcStreamAddedPayload;
    };

    interface ConstructorArgs {
        emitter: { emit: <K extends keyof RtcEvents>(eventName: K, args: RtcEvents[K]) => void };
        serverSocket: ServerSocket;
        webrtcProvider: {
            getMediaConstraints: () => { audio: boolean; video: boolean };
            deferrable: (clientId: string) => boolean;
        };
        features: {
            lowDataModeEnabled: boolean;
            sfuServerOverrideHost: undefined;
            turnServerOverrideHost: undefined;
            useOnlyTURN: undefined;
            vp9On: boolean;
            h264On: boolean;
            simulcastScreenshareOn: boolean;
            deviceHandlerFactory?: HandlerFactory;
        };
        logger: {
            debug: (message: string) => void;
            error: (message: string) => void;
            info: (message: string) => void;
            log: (message: string) => void;
            warn: (message: string) => void;
        };
    }
    export default class RtcManagerDispatcher {
        constructor(args: ConstructorArgs);
    }
}

declare module "@whereby/jslib-media/src/webrtc/RtcManager" {
    export default interface RtcManager {
        acceptNewStream: ({
            activeBreakout: boolean,
            clientId: string,
            shouldAddLocalVideo: boolean,
            streamId: string,
        }) => void;
        addNewStream(streamId: string, stream: MediaStream, isAudioEnabled: boolean, isVideoEnabled: boolean): void;
        disconnect(streamId: string, activeBreakout: boolean): void;
        disconnectAll(): void;
        replaceTrack(oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack): Promise<void>;
        removeStream(streamId: string, _stream: MediaStream, requestedByClientId: string | null): void;
        shouldAcceptStreamsFromBothSides?: () => boolean;
        updateStreamResolution(streamId: string, ignored: null, resolution: { width: number; height: number }): void;
        sendStatsCustomEvent(eventName: string, data: unknown): void;
    }
}

declare const assert: {
    (value: unknown, message?: string | Error): asserts value;
    ok(value: unknown, message?: string | Error): asserts value;
    notEqual<T>(actual: T, expected: T, message: string): void;
};

declare module "@whereby/jslib-media/src/utils/assert" {
    export = assert;
}

declare module "@whereby/jslib-media/src/utils/urls" {
    export function fromLocation({ host }: { host: string }): { subdomain: string };
}

declare module "@whereby/jslib-media/src/utils/ServerSocket" {
    interface SocketConf {
        host?: string;
        path?: string;
        reconnectionDelay?: number;
        reconnectoinDelayMax?: number;
        timeout?: number;
        autoConnect?: boolean;
    }

    interface SocketManager {
        on: (eventName: string, callback: (args: unknown) => void) => void;
    }

    interface ClientRole {
        roleName: string;
    }

    interface SignalKnocker {
        clientId: string;
        displayName: string | null;
        imageUrl: string | null;
        liveVideo: boolean;
        userAvatarUrl: string | null;
        userId: string | null;
    }

    interface SignalClient {
        displayName: string;
        id: string;
        streams: string[];
        isAudioEnabled: boolean;
        isVideoEnabled: boolean;
        role: ClientRole;
        startedCloudRecordingAt: string | null;
    }

    interface AudioEnabledEvent {
        clientId: string;
        isAudioEnabled: boolean;
    }

    interface ChatMessage {
        id: string;
        messageType: "text";
        roomName: string;
        senderId: string;
        sig: string;
        text: string;
        timestamp: string;
        userId: string;
    }

    interface CloudRecordingStartedEvent {
        error?: string;
        startedAt?: string;
    }

    interface ClientLeftEvent {
        clientId: string;
    }
    interface NewClientEvent {
        client: SignalClient;
        room?: {
            session: {
                createdAt: string;
                id: string;
            } | null;
        };
    }

    interface KnockerLeftEvent {
        clientId: string;
    }

    interface KnockAcceptedEvent {
        clientId: string;
        metadata: {
            roomKey: string;
            roomName: string;
        };
        resolution: "accepted";
    }

    interface KnockRejectedEvent {
        clientId: string;
        resolution: "rejected";
    }

    interface RoomJoinedEvent {
        error?: string;
        isLocked: boolean;
        room?: {
            clients: SignalClient[];
            knockers: SignalKnocker[];
            session: {
                createdAt: string;
                id: string;
            } | null;
        };
        selfId: string;
    }

    interface RoomKnockedEvent {
        clientId: string;
        displayName: string | null;
        imageUrl: string | null;
        liveVideo: boolean;
    }

    interface RoomSessionEndedEvent {
        roomSessionId: string;
    }

    interface ScreenshareStartedEvent {
        clientId: string;
        streamId: string;
        hasAudioTrack: boolean;
    }

    interface ScreenshareStoppedEvent {
        clientId: string;
        streamId: string;
    }

    interface VideoEnabledEvent {
        clientId: string;
        isVideoEnabled: boolean;
    }

    interface ClientMetadataReceivedEvent {
        type: string;
        payload: { clientId: string; displayName: string };
    }

    interface SignalEvents {
        audio_enabled: AudioEnabledEvent;
        chat_message: ChatMessage;
        client_left: ClientLeftEvent;
        client_metadata_received: ClientMetadataReceivedEvent;
        cloud_recording_started: CloudRecordingStartedEvent;
        cloud_recording_stopped: void;
        chat_message: ChatMessage;
        connect: void;
        connect_error: void;
        device_identified: void;
        disconnect: void;
        knock_handled: KnockAcceptedEvent | KnockRejectedEvent;
        knocker_left: KnockerLeftEvent;
        new_client: NewClientEvent;
        room_joined: RoomJoinedEvent;
        room_knocked: RoomKnockedEvent;
        room_left: void;
        room_session_ended: RoomSessionEndedEvent;
        screenshare_started: ScreenshareStartedEvent;
        screenshare_stopped: ScreenshareStoppedEvent;
        streaming_stopped: void;
        video_enabled: VideoEnabledEvent;
    }

    interface IdentifyDeviceRequest {
        deviceCredentials: Credentials;
    }

    interface JoinRoomRequest {
        config: { isAudioEnabled: boolean; isVideoEnabled: boolean };
        organizationId: string;
        roomName: string;
        displayName?: string;
    }

    interface KnockRoomRequest {
        displayName: string;
        imageUrl: string | null;
        kickFromOtherRooms: boolean;
        liveVideo: boolean;
        organizationId: string;
        roomKey: string | null;
        roomName: string;
    }

    interface SignalRequests {
        chat_message: { text: string };
        enable_audio: { enabled: boolean };
        enable_video: { enabled: boolean };
        handle_knock: { action: "accept" | "reject"; clientId: string; response: unknown };
        identify_device: IdentifyDeviceRequest;
        join_room: JoinRoomRequest;
        knock_room: KnockRoomRequest;
        leave_room: void;
        send_client_metadata: { type: string; payload: { displayName?: string } };
        start_recording: { recording: string };
        stop_recording: void;
    }

    export default class ServerSocket {
        constructor(host: string, conf?: SocketConf);

        connect(): void;
        disconnect(): void;
        getManager(): SocketManager;
        emit<K extends keyof SignalRequests>(eventName: K, payload?: SignalRequests[k]);
        on<K extends keyof SignalEvents>(eventName: K, callback: (args: SignalEvents[K]) => void);
        once<K extends keyof SignalEvents>(eventName: K, callback: (args: SignalEvents[K]) => void);
    }
}

declare module "@whereby/jslib-media/src/webrtc/mediaConstraints" {
    type GetMediaConstraintsOptions = {
        disableAEC: boolean;
        disableAGC: boolean;
        hd: boolean;
        lax: boolean;
        lowDataMode: boolean;
        preferredDeviceIds: {
            audioId?: string;
            videoId?: string;
        };
        resolution?: string;
        simulcast: boolean;
        widescreen: boolean;
    };

    export function getMediaConstraints(options: GetMediaConstraintsOptions): MediaStreamConstraints;

    export type GetConstraintsOptions = {
        devices: MediaDeviceInfo[];
        audioId?: boolean | string;
        videoId?: boolean | string;
        type?: "ideal" | "exact";
        options: Omit<GetMediaConstraintsOptions, "preferredDeviceIds">;
    };

    export default function getConstraints(options: GetMediaConstraintsOptions);
}

declare module "@whereby/jslib-media/src/webrtc/MediaDevices" {
    import type { GetConstraintsOptions } from "@whereby/jslib-media/src/webrtc/mediaConstraints";

    type GetStreamOptions = {
        replaceStream?: MediaStream;
        fallback?: boolean;
    };

    type GetStreamResult = {
        error?: unknown;
        replacedTracks?: MediaStreamTrack[];
        stream: MediaStream;
    };

    export function getStream(
        constraintOpt: GetConstraintsOptions,
        getStreamOptions?: GetStreamOptions
    ): Promise<GetStreamResult>;

    export function enumerate(): Promise<MediaDeviceInfo[]>;

    export function getUpdatedDevices({
        oldDevices,
        newDevices,
        currentAudioId,
        currentVideoId,
        currentSpeakerId,
    }: {
        oldDevices: MediaDeviceInfo[];
        newDevices: MediaDeviceInfo[];
        currentAudioId?: string | undefined;
        currentVideoId?: string | undefined;
        currentSpeakerId?: string | undefined;
    }): {
        addedDevices: {
            audioinput?: { deviceId: string; label: string; kind: string };
            videoinput?: { deviceId: string; label: string; kind: string };
            audiooutput?: { deviceId: string; label: string; kind: string };
        };
        changedDevices: {
            audioinput?: { deviceId: string; label: string; kind: string };
            videoinput?: { deviceId: string; label: string; kind: string };
            audiooutput?: { deviceId: string; label: string; kind: string };
        };
    };

    export function getDeviceData({
        audioTrack,
        videoTrack,
        devices,
        stoppedVideoTrack,
        lastAudioId,
        lastVideoId,
    }: {
        audioTrack?: MediaStreamTrack | null;
        videoTrack?: MediaStreamTrack | null;
        devices: MediaDeviceInfo[];
        stoppedVideoTrack?: boolean;
        lastAudioId?: string | undefined;
        lastVideoId?: string | undefined;
    }): {
        audio: {
            deviceId: string;
            label: string;
            kind: string;
        };
        video: {
            deviceId: string;
            label: string;
            kind: string;
        };
    };
}
