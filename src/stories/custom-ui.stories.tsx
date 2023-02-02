import React, { useState } from "react";
import { useLocalMedia, useRoomConnection, VideoElement } from "../lib/react";

export default {
    title: "Examples/Custom UI",
};

const VideoExperience = ({ roomName, localStream }: { roomName: string; localStream?: MediaStream }) => {
    const [state, actions, components] = useRoomConnection(roomName, {
        localMediaConstraints: {
            audio: true,
            video: true,
        },
        localStream,
        logger: console,
    });

    const { localParticipant, remoteParticipants } = state;
    const { toggleCamera, toggleMicrophone } = actions;
    const { VideoView } = components;

    return (
        <div style={{ minHeight: 400, backgroundColor: "pink" }}>
            {[localParticipant, ...remoteParticipants].map((participant, i) => (
                <div key={participant?.id || i}>
                    {participant ? (
                        <div
                            className="bouncingball"
                            style={{
                                animationDelay: `${Math.random() * 1000}ms`,
                                left: i * 145,
                                ...(participant.isAudioEnabled
                                    ? {
                                          border: "2px solid grey",
                                      }
                                    : null),
                                ...(!participant.isVideoEnabled
                                    ? {
                                          backgroundColor: "green",
                                      }
                                    : null),
                            }}
                        >
                            {participant.stream && participant.isVideoEnabled && (
                                <VideoView
                                    stream={participant.stream}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            )}
                        </div>
                    ) : null}
                </div>
            ))}

            <button onClick={() => toggleCamera()}>Toggle camera</button>
            <button onClick={() => toggleMicrophone()}>Toggle microphone</button>
        </div>
    );
};

export const Simplistic = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [roomName, setRoomName] = useState(process.env.STORYBOOK_ROOM);

    return (
        <div>
            {roomName && isConnected ? (
                <VideoExperience roomName={roomName} />
            ) : (
                <div>
                    <label>Room name</label>
                    <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} />
                    <button onClick={() => setIsConnected(true)}>Connect</button>
                </div>
            )}
        </div>
    );
};

export const WithPreCall = () => {
    const [localStream] = useLocalMedia();
    const [shouldJoin, setShouldJoin] = useState(false);
    const roomUrl = process.env.STORYBOOK_ROOM || "";

    return (
        <div>
            {shouldJoin ? (
                <VideoExperience roomName={roomUrl} localStream={localStream} />
            ) : (
                <div>{localStream && <VideoElement stream={localStream} />}</div>
            )}
            <button onClick={() => setShouldJoin(!shouldJoin)}>{shouldJoin ? "Leave room" : "Join room"}</button>
        </div>
    );
};
