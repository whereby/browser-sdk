import React, { useEffect, useReducer, useState } from "react";
import VideoView from "./VideoView";
import { LocalMediaRef } from "./useLocalMedia";
import RoomConnection, {
    ChatMessage,
    CloudRecordingState,
    RoomConnectionOptions,
    ConnectionStatus,
    RoomEventsMap,
    LiveStreamState,
} from "../RoomConnection";
import { LocalParticipant, RemoteParticipant, Screenshare, WaitingParticipant } from "../RoomParticipant";

export type RemoteParticipantState = Omit<
    RemoteParticipant,
    "updateStreamState" | "newJoiner" | "streams" | "addStream" | "removeStream"
>;
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

const initialState: RoomConnectionState = {
    chatMessages: [],
    remoteParticipants: [],
    connectionStatus: "initializing",
    screenshares: [],
    waitingParticipants: [],
};

type RoomConnectionEvent =
    | {
          type: "CHAT_MESSAGES_CHANGED";
          payload: ChatMessage[];
      }
    | {
          type: "CLOUD_RECORDING_STARTED";
          payload: CloudRecordingState;
      }
    | {
          type: "CLOUD_RECORDING_REQUEST_STARTED";
      }
    | {
          type: "CLOUD_RECORDING_STARTED_ERROR";
          payload: CloudRecordingState;
      }
    | {
          type: "CLOUD_RECORDING_STOPPED";
      }
    | {
          type: "ROOM_JOINED";
          payload: {
              localParticipant: LocalParticipantState;
              remoteParticipants: RemoteParticipantState[];
              waitingParticipants: WaitingParticipant[];
          };
      }
    | {
          type: "CONNECTION_STATUS_CHANGED";
          payload: {
              connectionStatus: ConnectionStatus;
          };
      }
    | {
          type: "PARTICIPANTS_CHANGED";
          payload: {
              participants: RemoteParticipantState[];
          };
      }
    | {
          type: "LOCAL_CLIENT_DISPLAY_NAME_CHANGED";
          payload: {
              displayName: string;
          };
      }
    | {
          type: "SCREENSHARES_CHANGED";
          payload: {
              screenshares: Screenshare[];
          };
      }
    | {
          type: "STREAMING_STARTED";
          payload: LiveStreamState;
      }
    | {
          type: "STREAMING_STOPPED";
      }
    | {
          type: "LOCAL_SCREENSHARE_START_ERROR";
          payload: unknown;
      }
    | {
          type: "LOCAL_SCREENSHARE_STARTING";
      }
    | {
          type: "LOCAL_SCREENSHARE_STARTED";
      }
    | {
          type: "LOCAL_SCREENSHARE_STOPPED";
      }
    | {
          type: "LOCAL_CAMERA_ENABLED";
          payload: boolean;
      }
    | {
          type: "LOCAL_MICROPHONE_ENABLED";
          payload: boolean;
      }
    | {
          type: "WAITING_PARTICIPANTS_CHANGED";
          payload: {
              waitingParticipants: WaitingParticipant[];
          };
      };

// omit the internal props
function convertRemoteParticipantToRemoteParticipantState(p: RemoteParticipant): RemoteParticipantState {
    return {
        displayName: p.displayName,
        id: p.id,
        isAudioEnabled: p.isAudioEnabled,
        isLocalParticipant: p.isLocalParticipant,
        isVideoEnabled: p.isVideoEnabled,
        stream: p.stream,
    };
}

function reducer(state: RoomConnectionState, action: RoomConnectionEvent): RoomConnectionState {
    switch (action.type) {
        case "CHAT_MESSAGES_CHANGED":
            return {
                ...state,
                chatMessages: action.payload,
            };
        case "CLOUD_RECORDING_REQUEST_STARTED":
            return {
                ...state,
                cloudRecording: {
                    status: "requested",
                },
            };
        case "CLOUD_RECORDING_STARTED":
            return {
                ...state,
                cloudRecording: {
                    status: action.payload.status,
                    startedAt: action.payload.startedAt,
                },
            };
        case "CLOUD_RECORDING_STARTED_ERROR":
            return {
                ...state,
                cloudRecording: {
                    status: action.payload.status,
                    error: action.payload.error,
                },
            };
        case "CLOUD_RECORDING_STOPPED":
            delete state.cloudRecording;
            return {
                ...state,
            };
        case "ROOM_JOINED":
            return {
                ...state,
                localParticipant: action.payload.localParticipant,
                remoteParticipants: action.payload.remoteParticipants,
                waitingParticipants: action.payload.waitingParticipants,
                connectionStatus: "connected",
            };
        case "CONNECTION_STATUS_CHANGED":
            return {
                ...state,
                connectionStatus: action.payload.connectionStatus,
            };
        case "PARTICIPANTS_CHANGED":
            return {
                ...state,
                remoteParticipants: action.payload.participants,
            };

        case "LOCAL_CLIENT_DISPLAY_NAME_CHANGED":
            if (!state.localParticipant) return state;
            return {
                ...state,
                localParticipant: { ...state.localParticipant, displayName: action.payload.displayName },
            };
        case "SCREENSHARES_CHANGED":
            return {
                ...state,
                screenshares: action.payload.screenshares,
            };
        case "LOCAL_SCREENSHARE_START_ERROR":
            return {
                ...state,
                localScreenshareStatus: undefined,
            };
        case "LOCAL_SCREENSHARE_STARTING":
            return {
                ...state,
                localScreenshareStatus: "starting",
            };
        case "LOCAL_SCREENSHARE_STARTED":
            return {
                ...state,
                localScreenshareStatus: "active",
            };
        case "LOCAL_SCREENSHARE_STOPPED":
            return {
                ...state,
                localScreenshareStatus: undefined,
                screenshares: state.screenshares.filter((ss) => !ss.isLocal),
            };
        case "LOCAL_CAMERA_ENABLED":
            if (!state.localParticipant) return state;
            return {
                ...state,
                localParticipant: { ...state.localParticipant, isVideoEnabled: action.payload },
            };
        case "LOCAL_MICROPHONE_ENABLED":
            if (!state.localParticipant) return state;
            return {
                ...state,
                localParticipant: { ...state.localParticipant, isAudioEnabled: action.payload },
            };
        case "STREAMING_STARTED":
            return {
                ...state,
                liveStream: {
                    status: action.payload.status,
                    startedAt: action.payload.startedAt,
                },
            };
        case "STREAMING_STOPPED":
            delete state.liveStream;
            return {
                ...state,
            };
        case "WAITING_PARTICIPANTS_CHANGED":
            return {
                ...state,
                waitingParticipants: action.payload.waitingParticipants,
            };
        default:
            throw state;
    }
}

interface UseRoomConnectionOptions extends Omit<RoomConnectionOptions, "localMedia"> {
    localMedia?: LocalMediaRef;
}

interface RoomConnectionActions {
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

type VideoViewComponentProps = Omit<React.ComponentProps<typeof VideoView>, "onResize">;

interface RoomConnectionComponents {
    VideoView: (props: VideoViewComponentProps) => ReturnType<typeof VideoView>;
}

export type RoomConnectionRef = {
    state: RoomConnectionState;
    actions: RoomConnectionActions;
    components: RoomConnectionComponents;
    _ref: RoomConnection;
};

const defaultRoomConnectionOptions: UseRoomConnectionOptions = {
    localMediaOptions: {
        audio: true,
        video: true,
    },
};

export function useRoomConnection(
    roomUrl: string,
    roomConnectionOptions = defaultRoomConnectionOptions
): RoomConnectionRef {
    const [roomConnection] = useState<RoomConnection>(
        () =>
            new RoomConnection(roomUrl, {
                ...roomConnectionOptions,
                localMedia: roomConnectionOptions?.localMedia?._ref || undefined,
            })
    );
    const [state, dispatch] = useReducer(reducer, initialState);

    type EventListener<K extends keyof RoomEventsMap> = {
        eventName: K;
        listener: RoomEventsMap[K];
        options?: boolean | AddEventListenerOptions;
    };

    function createEventListener<K extends keyof RoomEventsMap>(
        eventName: K,
        listener: RoomEventsMap[K],
        options?: boolean | AddEventListenerOptions
    ): EventListener<K> {
        return {
            eventName,
            listener,
            options,
        };
    }

    const eventListeners = React.useMemo(
        (): EventListener<keyof RoomEventsMap>[] => [
            createEventListener("chat_messages_changed", (e) => {
                dispatch({ type: "CHAT_MESSAGES_CHANGED", payload: e.detail });
            }),
            createEventListener("cloud_recording_request_started", () => {
                dispatch({ type: "CLOUD_RECORDING_REQUEST_STARTED" });
            }),
            createEventListener("cloud_recording_started", (e) => {
                const { status, startedAt } = e.detail;
                dispatch({ type: "CLOUD_RECORDING_STARTED", payload: { status, startedAt } });
            }),
            createEventListener("cloud_recording_started_error", (e) => {
                dispatch({ type: "CLOUD_RECORDING_STARTED_ERROR", payload: e.detail });
            }),
            createEventListener("cloud_recording_stopped", () => {
                dispatch({ type: "CLOUD_RECORDING_STOPPED" });
            }),
            createEventListener("local_camera_enabled", (e) => {
                const { enabled } = e.detail;
                dispatch({ type: "LOCAL_CAMERA_ENABLED", payload: enabled });
            }),
            createEventListener("local_microphone_enabled", (e) => {
                const { enabled } = e.detail;
                dispatch({ type: "LOCAL_MICROPHONE_ENABLED", payload: enabled });
            }),
            createEventListener("participants_changed", (e) => {
                const { remoteParticipants } = e.detail;

                dispatch({
                    type: "PARTICIPANTS_CHANGED",
                    payload: {
                        participants: remoteParticipants.map(convertRemoteParticipantToRemoteParticipantState),
                    },
                });
            }),
            createEventListener("connection_status_changed", (e) => {
                const { connectionStatus } = e.detail;
                dispatch({
                    type: "CONNECTION_STATUS_CHANGED",
                    payload: { connectionStatus },
                });
            }),
            createEventListener("room_joined", (e) => {
                const { localParticipant, remoteParticipants, waitingParticipants } = e.detail;
                dispatch({
                    type: "ROOM_JOINED",
                    payload: {
                        localParticipant,
                        remoteParticipants: remoteParticipants.map(convertRemoteParticipantToRemoteParticipantState),
                        waitingParticipants,
                    },
                });
            }),
            createEventListener("screenshares_changed", (e) => {
                const screenshares = e.detail;
                dispatch({
                    type: "SCREENSHARES_CHANGED",
                    payload: {
                        screenshares,
                    },
                });
            }),
            // createEventListener("screenshare_stopped", (e) => {
            //     const { participantId, id } = e.detail;
            //     dispatch({
            //         type: "SCREENSHARE_STOPPED",
            //         payload: { participantId, id },
            //     });
            //     // dispach LOCAL_SCREENSHARE_STOPPED here because the exposed
            //     // stopScreenshare method is not called when the screenshare is
            //     // stopped by the browser's native stop screenshare button
            //     if (participantId === state.localParticipant?.id) {
            //         dispatch({ type: "LOCAL_SCREENSHARE_STOPPED" });
            //     }
            // }),
            createEventListener("streaming_started", (e) => {
                const { status, startedAt } = e.detail;
                dispatch({ type: "STREAMING_STARTED", payload: { status, startedAt } });
            }),
            createEventListener("streaming_stopped", () => {
                dispatch({ type: "STREAMING_STOPPED" });
            }),
            createEventListener("waiting_participants_changed", (e) => {
                const waitingParticipants = e.detail;
                dispatch({
                    type: "WAITING_PARTICIPANTS_CHANGED",
                    payload: {
                        waitingParticipants,
                    },
                });
            }),
        ],
        []
    );

    useEffect(() => {
        eventListeners.forEach(({ eventName, listener }) => {
            roomConnection.addEventListener(eventName, listener);
        });

        roomConnection.join();

        return () => {
            eventListeners.forEach(({ eventName, listener }) => {
                roomConnection.removeEventListener(eventName, listener);
            });
            roomConnection.leave();
        };
    }, []);

    return {
        state,
        actions: {
            knock: () => {
                roomConnection.knock();
            },
            sendChatMessage: (text) => {
                roomConnection.sendChatMessage(text);
            },
            setDisplayName: (displayName) => {
                roomConnection.setDisplayName(displayName);
                dispatch({ type: "LOCAL_CLIENT_DISPLAY_NAME_CHANGED", payload: { displayName } });
            },
            toggleCamera: (enabled) => {
                roomConnection.localMedia.toggleCameraEnabled(enabled);
            },
            toggleMicrophone: (enabled) => {
                roomConnection.localMedia.toggleMichrophoneEnabled(enabled);
            },
            acceptWaitingParticipant: (participantId) => {
                roomConnection.acceptWaitingParticipant(participantId);
            },
            rejectWaitingParticipant: (participantId) => {
                roomConnection.rejectWaitingParticipant(participantId);
            },
            startCloudRecording: () => {
                // don't start recording if it's already started or requested
                if (state.cloudRecording && ["recording", "requested"].includes(state.cloudRecording?.status)) {
                    return;
                }
                roomConnection.startCloudRecording();
            },
            stopCloudRecording: () => {
                roomConnection.stopCloudRecording();
            },
            startScreenshare: async () => {
                dispatch({ type: "LOCAL_SCREENSHARE_STARTING" });

                try {
                    await roomConnection.startScreenshare();
                    dispatch({ type: "LOCAL_SCREENSHARE_STARTED" });
                } catch (error) {
                    dispatch({ type: "LOCAL_SCREENSHARE_START_ERROR", payload: error });
                }
            },
            stopScreenshare: () => {
                roomConnection.stopScreenshare();
            },
        },
        components: {
            VideoView: (props: VideoViewComponentProps): JSX.Element =>
                React.createElement(
                    VideoView as React.ComponentType<VideoViewComponentProps>,
                    Object.assign({}, props, {
                        onResize: ({
                            stream,
                            width,
                            height,
                        }: {
                            stream: MediaStream;
                            width: number;
                            height: number;
                        }) => {
                            roomConnection.updateStreamResolution({
                                streamId: stream.id,
                                width,
                                height,
                            });
                        },
                    })
                ),
        },
        _ref: roomConnection,
    };
}
