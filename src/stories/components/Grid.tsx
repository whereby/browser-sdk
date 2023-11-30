import React, { useEffect, useState } from "react";
import { VideoView } from "~/lib/react";
import { RoomConnectionRef } from "~/lib/react/useRoomConnection";

export default function Grid({ roomConnection }: { roomConnection: RoomConnectionRef }) {
    const { state, components } = roomConnection;

    const streams = state.remoteParticipants.filter((p) => !!p.stream).map((p) => p.stream);

    return (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
            {streams.map((s) => {
                if (!s) return;
                return <Reporting key={s.id} stream={s} VW={components.VideoView} />;
            })}
        </div>
    );
}

function Reporting({ stream, VW }: { stream: MediaStream; VW: typeof VideoView }) {
    const [id] = useState<string>((Math.random() * 10000).toString());
    const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
    const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout>();
    const [videoResolution, setVideoResolution] = useState("width x height");

    useEffect(() => {
        const videEl = document.getElementById(id) as HTMLVideoElement;
        if (videEl) {
            setVideoElement(videEl);
        }
        return () => {
            clearInterval(refreshInterval);
        };
    }, []);

    useEffect(() => {
        clearInterval(refreshInterval);
        if (videoElement) {
            const timerId = setInterval(() => {
                setVideoResolution(`${videoElement.videoWidth} x ${videoElement.videoHeight}`);
            });

            setRefreshInterval(timerId);
        }
    }, [videoElement]);

    return (
        <div>
            <span>Received stream resolution: {videoResolution}</span>
            <VW id={id} stream={stream} />
        </div>
    );
}
