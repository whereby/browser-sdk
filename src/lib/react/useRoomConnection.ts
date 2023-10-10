import React, { useEffect, useReducer, useState } from "react";
import VideoView from "./VideoView";
import { LocalMediaRef } from "./useLocalMedia";
import RoomConnection, {
    ChatMessage,
    CloudRecordingState,
    RoomConnectionOptions,
    RoomConnectionStatus,
    RoomEventsMap,
    StreamingState,
} from "../RoomConnection";
import { LocalParticipant, RemoteParticipant, Screenshare, WaitingParticipant } from "../RoomParticipant";

type RemoteParticipantState = Omit<RemoteParticipant, "updateStreamState">;

export interface RoomConnectionState {
    chatMessages: ChatMessage[];
    cloudRecording: CloudRecordingState;
    isJoining: boolean;
    isStartingScreenshare: boolean;
    joinError: unknown;
    startScreenshareError: unknown;
    localParticipant?: LocalParticipant;
    mostRecentChatMessage: ChatMessage | null;
    remoteParticipants: RemoteParticipantState[];
    screenshares: Screenshare[];
    roomConnectionStatus: RoomConnectionStatus;
    streaming: StreamingState;
    waitingParticipants: WaitingParticipant[];
}

const initialState: RoomConnectionState = {
    chatMessages: [],
    cloudRecording: {
        status: "",
        startedAt: null,
    },
    isJoining: false,
    isStartingScreenshare: false,
    joinError: null,
    startScreenshareError: null,
    mostRecentChatMessage: null,
    remoteParticipants: [],
    roomConnectionStatus: "",
    screenshares: [],
    streaming: {
        status: "",
        startedAt: null,
    },
    waitingParticipants: [],
};

type RoomConnectionEvents =
    | {
          type: "CHAT_MESSAGE";
          payload: ChatMessage;
      }
    | {
          type: "CLOUD_RECORDING_STARTED";
          payload: CloudRecordingState;
      }
    | {
          type: "CLOUD_RECORDING_STOPPED";
      }
    | {
          type: "ROOM_JOINED";
          payload: {
              localParticipant: LocalParticipant;
              remoteParticipants: RemoteParticipantState[];
              waitingParticipants: WaitingParticipant[];
          };
      }
    | {
          type: "ROOM_CONNECTION_STATUS_CHANGED";
          payload: {
              roomConnectionStatus: RoomConnectionStatus;
          };
      }
    | {
          type: "PARTICIPANT_AUDIO_ENABLED";
          payload: {
              participantId: string;
              isAudioEnabled: boolean;
          };
      }
    | {
          type: "PARTICIPANT_JOINED";
          payload: {
              paritipant: RemoteParticipantState;
          };
      }
    | {
          type: "PARTICIPANT_LEFT";
          payload: {
              participantId: string;
          };
      }
    | {
          type: "PARTICIPANT_STREAM_ADDED";
          payload: {
              participantId: string;
              stream: MediaStream;
          };
      }
    | {
          type: "PARTICIPANT_VIDEO_ENABLED";
          payload: {
              participantId: string;
              isVideoEnabled: boolean;
          };
      }
    | {
          type: "PARTICIPANT_METADATA_CHANGED";
          payload: {
              participantId: string;
              displayName: string;
          };
      }
    | {
          type: "LOCAL_CLIENT_DISPLAY_NAME_CHANGED";
          payload: {
              displayName: string;
          };
      }
    | {
          type: "SCREENSHARE_STARTED";
          payload: {
              participantId: string;
              stream: MediaStream;
              id: string;
              hasAudioTrack: boolean;
              isLocal: boolean;
          };
      }
    | {
          type: "SCREENSHARE_STOPPED";
          payload: {
              participantId: string;
              id: string;
          };
      }
    | {
          type: "STREAMING_STARTED";
          payload: StreamingState;
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
          type: "LOCAL_SCREENSHARE_STOPPED";
      }
    | {
          type: "WAITING_PARTICIPANT_JOINED";
          payload: {
              participantId: string;
              displayName: string | null;
          };
      }
    | {
          type: "WAITING_PARTICIPANT_LEFT";
          payload: {
              participantId: string;
          };
      };

function updateParticipant(
    remoteParticipants: RemoteParticipantState[],
    participantId: string,
    updates: Partial<RemoteParticipantState>
): RemoteParticipantState[] {
    const existingParticipant = remoteParticipants.find((p) => p.id === participantId);
    if (!existingParticipant) {
        return remoteParticipants;
    }
    const index = remoteParticipants.indexOf(existingParticipant);

    return [
        ...remoteParticipants.slice(0, index),
        { ...existingParticipant, ...updates },
        ...remoteParticipants.slice(index + 1),
    ];
}

function addScreenshare(screenshares: Screenshare[], screenshare: Screenshare): Screenshare[] {
    const existingScreenshare = screenshares.find((ss) => ss.id === screenshare.id);
    if (existingScreenshare) {
        return screenshares;
    }
    return [...screenshares, screenshare];
}

function reducer(state: RoomConnectionState, action: RoomConnectionEvents): RoomConnectionState {
    switch (action.type) {
        case "CHAT_MESSAGE":
            return {
                ...state,
                chatMessages: [...state.chatMessages, action.payload],
                mostRecentChatMessage: action.payload,
            };
        case "CLOUD_RECORDING_STARTED":
            return {
                ...state,
                cloudRecording: {
                    status: action.payload.status,
                    startedAt: action.payload.startedAt,
                },
            };
        case "CLOUD_RECORDING_STOPPED":
            return {
                ...state,
                cloudRecording: {
                    status: "",
                    startedAt: null,
                },
            };
        case "ROOM_JOINED":
            return {
                ...state,
                localParticipant: action.payload.localParticipant,
                remoteParticipants: action.payload.remoteParticipants,
                waitingParticipants: action.payload.waitingParticipants,
                roomConnectionStatus: "connected",
            };
        case "ROOM_CONNECTION_STATUS_CHANGED":
            return {
                ...state,
                roomConnectionStatus: action.payload.roomConnectionStatus,
            };
        case "PARTICIPANT_AUDIO_ENABLED":
            return {
                ...state,
                remoteParticipants: updateParticipant(state.remoteParticipants, action.payload.participantId, {
                    isAudioEnabled: action.payload.isAudioEnabled,
                }),
            };
        case "PARTICIPANT_JOINED":
            return {
                ...state,
                remoteParticipants: [...state.remoteParticipants, action.payload.paritipant],
            };
        case "PARTICIPANT_LEFT":
            return {
                ...state,
                remoteParticipants: [...state.remoteParticipants.filter((p) => p.id !== action.payload.participantId)],
            };
        case "PARTICIPANT_STREAM_ADDED":
            return {
                ...state,
                remoteParticipants: updateParticipant(state.remoteParticipants, action.payload.participantId, {
                    stream: action.payload.stream,
                }),
            };
        case "PARTICIPANT_VIDEO_ENABLED":
            return {
                ...state,
                remoteParticipants: updateParticipant(state.remoteParticipants, action.payload.participantId, {
                    isVideoEnabled: action.payload.isVideoEnabled,
                }),
            };
        case "PARTICIPANT_METADATA_CHANGED":
            return {
                ...state,
                remoteParticipants: [
                    ...state.remoteParticipants.map((p) =>
                        p.id === action.payload.participantId ? { ...p, displayName: action.payload.displayName } : p
                    ),
                ],
            };
        case "LOCAL_CLIENT_DISPLAY_NAME_CHANGED":
            if (!state.localParticipant) return state;
            return {
                ...state,
                localParticipant: { ...state.localParticipant, displayName: action.payload.displayName },
            };
        case "SCREENSHARE_STARTED":
            return {
                ...state,
                screenshares: addScreenshare(state.screenshares, {
                    participantId: action.payload.participantId,
                    id: action.payload.id,
                    hasAudioTrack: action.payload.hasAudioTrack,
                    stream: action.payload.stream,
                    isLocal: action.payload.isLocal,
                }),
            };
        case "SCREENSHARE_STOPPED":
            return {
                ...state,
                screenshares: state.screenshares.filter((ss) => ss.id !== action.payload.id),
            };
        case "LOCAL_SCREENSHARE_START_ERROR":
            return {
                ...state,
                isStartingScreenshare: false,
                startScreenshareError: action.payload,
            };
        case "LOCAL_SCREENSHARE_STARTING":
            return {
                ...state,
                isStartingScreenshare: true,
            };
        case "LOCAL_SCREENSHARE_STOPPED":
            return {
                ...state,
                screenshares: state.screenshares.filter((ss) => !ss.isLocal),
            };
        case "STREAMING_STARTED":
            return {
                ...state,
                streaming: {
                    status: action.payload.status,
                    startedAt: action.payload.startedAt,
                },
            };
        case "STREAMING_STOPPED":
            return {
                ...state,
                streaming: {
                    status: "",
                    startedAt: null,
                },
            };
        case "WAITING_PARTICIPANT_JOINED":
            return {
                ...state,
                waitingParticipants: [
                    ...state.waitingParticipants,
                    { id: action.payload.participantId, displayName: action.payload.displayName },
                ],
            };
        case "WAITING_PARTICIPANT_LEFT":
            return {
                ...state,
                waitingParticipants: state.waitingParticipants.filter((wp) => wp.id !== action.payload.participantId),
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
    startScreenshare(): void;
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

export function useRoomConnection(roomUrl: string, roomConnectionOptions: UseRoomConnectionOptions): RoomConnectionRef {
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
            createEventListener("chat_message", (e) => {
                dispatch({ type: "CHAT_MESSAGE", payload: e.detail });
            }),
            createEventListener("cloud_recording_started", (e) => {
                const { status, startedAt } = e.detail;
                dispatch({ type: "CLOUD_RECORDING_STARTED", payload: { status, startedAt } });
            }),
            createEventListener("cloud_recording_stopped", () => {
                dispatch({ type: "CLOUD_RECORDING_STOPPED" });
            }),
            createEventListener("participant_audio_enabled", (e) => {
                const { participantId, isAudioEnabled } = e.detail;
                dispatch({ type: "PARTICIPANT_AUDIO_ENABLED", payload: { participantId, isAudioEnabled } });
            }),
            createEventListener("participant_joined", (e) => {
                const { remoteParticipant } = e.detail;
                dispatch({ type: "PARTICIPANT_JOINED", payload: { paritipant: remoteParticipant } });
            }),
            createEventListener("participant_left", (e) => {
                const { participantId } = e.detail;
                dispatch({ type: "PARTICIPANT_LEFT", payload: { participantId } });
            }),
            createEventListener("participant_metadata_changed", (e) => {
                const { participantId, displayName } = e.detail;
                dispatch({ type: "PARTICIPANT_METADATA_CHANGED", payload: { participantId, displayName } });
            }),
            createEventListener("participant_stream_added", (e) => {
                const { participantId, stream } = e.detail;
                dispatch({ type: "PARTICIPANT_STREAM_ADDED", payload: { participantId, stream } });
            }),
            createEventListener("participant_video_enabled", (e) => {
                const { participantId, isVideoEnabled } = e.detail;
                dispatch({ type: "PARTICIPANT_VIDEO_ENABLED", payload: { participantId, isVideoEnabled } });
            }),
            createEventListener("room_connection_status_changed", (e) => {
                const { roomConnectionStatus } = e.detail;
                dispatch({
                    type: "ROOM_CONNECTION_STATUS_CHANGED",
                    payload: { roomConnectionStatus },
                });
            }),
            createEventListener("room_joined", (e) => {
                const { localParticipant, remoteParticipants, waitingParticipants } = e.detail;
                dispatch({
                    type: "ROOM_JOINED",
                    payload: { localParticipant, remoteParticipants, waitingParticipants },
                });
            }),
            createEventListener("screenshare_started", (e) => {
                const { participantId, stream, id, hasAudioTrack, isLocal } = e.detail;
                dispatch({
                    type: "SCREENSHARE_STARTED",
                    payload: { participantId, stream, id, hasAudioTrack, isLocal },
                });
            }),
            createEventListener("screenshare_stopped", (e) => {
                const { participantId, id } = e.detail;
                dispatch({
                    type: "SCREENSHARE_STOPPED",
                    payload: { participantId, id },
                });
            }),
            createEventListener("streaming_started", (e) => {
                const { status, startedAt } = e.detail;
                dispatch({ type: "STREAMING_STARTED", payload: { status, startedAt } });
            }),
            createEventListener("streaming_stopped", () => {
                dispatch({ type: "STREAMING_STOPPED" });
            }),
            createEventListener("waiting_participant_joined", (e) => {
                const { participantId, displayName } = e.detail;
                dispatch({
                    type: "WAITING_PARTICIPANT_JOINED",
                    payload: { participantId, displayName },
                });
            }),
            createEventListener("waiting_participant_left", (e) => {
                const { participantId } = e.detail;
                dispatch({
                    type: "WAITING_PARTICIPANT_LEFT",
                    payload: { participantId },
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
            startScreenshare: () => {
                dispatch({ type: "LOCAL_SCREENSHARE_STARTING" });

                try {
                    roomConnection.startScreenshare();
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
