import { useEffect, useReducer, useState } from "react";
import RoomConnection, { RoomConnectionOptions } from "../RoomConnection";
import reducer, { RoomState } from "../reducer";

interface RoomConnectionActions {
    toggleCamera(enabled?: boolean): void;
    toggleMicrophone(enabled?: boolean): void;
}

export default function useRoomConnection(
    roomUrl: string,
    roomConnectionOptions: RoomConnectionOptions
): [state: RoomState, actions: RoomConnectionActions] {
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
        },
    ];
}
