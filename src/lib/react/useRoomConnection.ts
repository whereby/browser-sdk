import { useEffect, useReducer, useState } from "react";
import VideoView from "./VideoView";
import { LocalMediaRef } from "./useLocalMedia";
import RoomConnection, { RoomConnectionOptions } from "../RoomConnection";
import { LocalParticipant, RemoteParticipant } from "../RoomParticipant";

type RemoteParticipantState = Omit<RemoteParticipant, "updateStreamState">;

export interface RoomConnectionState {
    isJoining: boolean;
    joinError: unknown;
    localParticipant?: LocalParticipant;
    roomConnectionStatus?: "connecting" | "connected" | "disconnected";
    remoteParticipants: RemoteParticipantState[];
}

const initialState: RoomConnectionState = {
    isJoining: false,
    joinError: null,
    remoteParticipants: [],
};

type RoomConnectionEvents =
    | {
          type: "ROOM_JOINED";
          payload: {
              localParticipant: LocalParticipant;
              remoteParticipants: RemoteParticipantState[];
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

function reducer(state: RoomConnectionState, action: RoomConnectionEvents): RoomConnectionState {
    switch (action.type) {
        case "ROOM_JOINED":
            return {
                ...state,
                localParticipant: action.payload.localParticipant,
                remoteParticipants: action.payload.remoteParticipants,
                roomConnectionStatus: "connected",
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
        default:
            throw state;
    }
}

interface UseRoomConnectionOptions extends Omit<RoomConnectionOptions, "localMedia"> {
    localMedia?: LocalMediaRef;
}

interface RoomConnectionActions {
    toggleCamera(enabled?: boolean): void;
    toggleMicrophone(enabled?: boolean): void;
    setDisplayName(displayName: string): void;
}

interface RoomConnectionComponents {
    VideoView: typeof VideoView;
}

export type RoomConnectionRef = {
    state: RoomConnectionState;
    actions: RoomConnectionActions;
    components: RoomConnectionComponents;
    _ref: RoomConnection;
};

export default function useRoomConnection(
    roomUrl: string,
    roomConnectionOptions: UseRoomConnectionOptions
): RoomConnectionRef {
    const [roomConnection] = useState<RoomConnection>(
        () =>
            new RoomConnection(roomUrl, {
                ...roomConnectionOptions,
                localMedia: roomConnectionOptions?.localMedia?._ref || undefined,
            })
    );
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        roomConnection.addEventListener("participant_audio_enabled", (e) => {
            const { participantId, isAudioEnabled } = e.detail;
            dispatch({ type: "PARTICIPANT_AUDIO_ENABLED", payload: { participantId, isAudioEnabled } });
        });

        roomConnection.addEventListener("participant_joined", (e) => {
            const { remoteParticipant } = e.detail;
            dispatch({ type: "PARTICIPANT_JOINED", payload: { paritipant: remoteParticipant } });
        });

        roomConnection.addEventListener("participant_left", (e) => {
            const { participantId } = e.detail;
            dispatch({ type: "PARTICIPANT_LEFT", payload: { participantId } });
        });

        roomConnection.addEventListener("participant_stream_added", (e) => {
            const { participantId, stream } = e.detail;
            dispatch({ type: "PARTICIPANT_STREAM_ADDED", payload: { participantId, stream } });
        });

        roomConnection.addEventListener("room_joined", (e) => {
            const { localParticipant, remoteParticipants } = e.detail;
            dispatch({ type: "ROOM_JOINED", payload: { localParticipant, remoteParticipants } });
        });

        roomConnection.addEventListener("participant_video_enabled", (e) => {
            const { participantId, isVideoEnabled } = e.detail;
            dispatch({ type: "PARTICIPANT_VIDEO_ENABLED", payload: { participantId, isVideoEnabled } });
        });

        roomConnection.addEventListener("participant_metadata_changed", (e) => {
            const { participantId, displayName } = e.detail;
            dispatch({ type: "PARTICIPANT_METADATA_CHANGED", payload: { participantId, displayName } });
        });

        roomConnection.join();

        return () => {
            roomConnection.leave();
        };
    }, []);

    return {
        state,
        actions: {
            toggleCamera: (enabled) => {
                roomConnection?.localMedia.toggleCameraEnabled(enabled);
            },
            toggleMicrophone: (enabled) => {
                roomConnection?.localMedia.toggleMichrophoneEnabled(enabled);
            },
            setDisplayName: (displayName) => {
                roomConnection?.setDisplayName(displayName);
                dispatch({ type: "LOCAL_CLIENT_DISPLAY_NAME_CHANGED", payload: { displayName } });
            },
        },
        components: {
            VideoView,
        },
        _ref: roomConnection,
    };
}
