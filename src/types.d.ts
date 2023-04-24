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
        streamId: string;
    }

    type RtcEvents = {
        rtc_manager_created: RtcManagerCreatedPayload;
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
        shouldAcceptStreamsFromBothSides?: () => boolean;
    }
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

    interface ClientLeftEvent {
        clientId: string;
    }
    interface NewClientEvent {
        client: SignalClient;
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
        };
        selfId: string;
    }

    interface RoomKnockedEvent {
        clientId: string;
        displayName: string | null;
        imageUrl: string | null;
        liveVideo: boolean;
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
        client_left: ClientLeftEvent;
        client_metadata_received: ClientMetadataReceivedEvent;
        chat_message: ChatMessage;
        connect: void;
        device_identified: void;
        knock_handled: KnockAcceptedEvent | KnockRejectedEvent;
        knocker_left: KnockerLeftEvent;
        new_client: NewClientEvent;
        room_joined: RoomJoinedEvent;
        room_knocked: RoomKnockedEvent;
        room_left: void;
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
    }

    export default class ServerSocket {
        constructor(host: string, conf?: SocketConf);

        connect(): void;
        disconnect(): void;
        emit<K extends keyof SignalRequests>(eventName: K, payload?: SignalRequests[k]);
        on<K extends keyof SignalEvents>(eventName: K, callback: (args: SignalEvents[K]) => void);
        once<K extends keyof SignalEvents>(eventName: K, callback: (args: SignalEvents[K]) => void);
    }
}
