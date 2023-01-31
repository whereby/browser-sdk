import { useEffect, useReducer, useState } from "react";
import RoomConnection, { RoomConnectionOptions } from "../RoomConnection";
import reducer, { RoomState } from "../reducer";
import VideoElement from "./VideoElement";

interface RoomConnectionActions {
    toggleCamera(enabled?: boolean): void;
    toggleMicrophone(enabled?: boolean): void;
    setDisplayName(displayName: string): void;
}

interface RoomConnectionComponents {
    VideoView: typeof VideoElement;
}

export default function useRoomConnection(
    roomUrl: string,
    roomConnectionOptions: RoomConnectionOptions
): [state: RoomState, actions: RoomConnectionActions, components: RoomConnectionComponents] {
    const [roomConnection, setRoomConnection] = useState<RoomConnection | null>(null);
    const [state, dispatch] = useReducer(reducer, { remoteParticipants: [] });

    useEffect(() => {
        setRoomConnection(new RoomConnection(roomUrl, roomConnectionOptions));
    }, [roomUrl]);

    useEffect(() => {
        if (!roomConnection) {
            return;
        }

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
    }, [roomConnection]);

    return [
        state,
        {
            toggleCamera: (enabled) => {
                roomConnection?.toggleCamera(enabled);
            },
            toggleMicrophone: (enabled) => {
                roomConnection?.toggleMicrophone(enabled);
            },
            setDisplayName: (displayName) => {
                roomConnection?.setDisplayName(displayName);
                dispatch({ type: "LOCAL_CLIENT_DISPLAY_NAME_CHANGED", payload: { displayName } });
            },
        },
        {
            VideoView: VideoElement,
        },
    ];
}
