import React, { useState } from "react";
import { useLocalMedia, useRoomConnection, VideoElement } from "../lib/react";
import "./styles.css";

export default {
    title: "Examples/Custom UI",
    argTypes: {
        displayName: { control: "text", defaultValue: "SDK" },
        roomUrl: { control: "text", defaultValue: process.env.STORYBOOK_ROOM, type: { required: true } },
    },
};

const DisplayNameForm = ({
    initialDisplayName,
    onSetDisplayName,
}: {
    initialDisplayName?: string;
    onSetDisplayName: (displayName: string) => void;
}) => {
    const [displayName, setDisplayName] = useState(initialDisplayName || "");

    return (
        <div>
            <label htmlFor="displayName">Display name: </label>
            <input
                type="text"
                name="displayName"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
            />
            <button onClick={() => onSetDisplayName(displayName || "")}>Save</button>
        </div>
    );
};

const VideoExperience = ({
    displayName,
    roomName,
    localStream,
}: {
    displayName?: string;
    roomName: string;
    localStream?: MediaStream;
}) => {
    const [state, actions, components] = useRoomConnection(roomName, {
        displayName,
        localMediaConstraints: {
            audio: true,
            video: true,
        },
        localStream,
        logger: console,
    });

    const { localParticipant, remoteParticipants } = state;
    const { setDisplayName, toggleCamera, toggleMicrophone } = actions;
    const { VideoView } = components;

    return (
        <div>
            <div className="container">
                {[localParticipant, ...remoteParticipants].map((participant, i) => (
                    <div className="participantWrapper" key={participant?.id || i}>
                        {participant ? (
                            <>
                                <div
                                    className="bouncingball"
                                    style={{
                                        animationDelay: `${Math.random() * 1000}ms`,
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
                                <div className="displayName">{participant.displayName || "Guest"}</div>
                            </>
                        ) : null}
                    </div>
                ))}
            </div>
            <div className="controls">
                <button onClick={() => toggleCamera()}>Toggle camera</button>
                <button onClick={() => toggleMicrophone()}>Toggle microphone</button>
                <DisplayNameForm initialDisplayName={displayName} onSetDisplayName={setDisplayName} />
            </div>
        </div>
    );
};

const roomRegEx = new RegExp(/^https:\/\/.*\/.*/);

export const Simplistic = ({ roomUrl, displayName }: { roomUrl: string; displayName?: string }) => {
    if (!roomUrl || !roomUrl.match(roomRegEx)) {
        return <p>Set room url on the Controls panel</p>;
    }

    return <VideoExperience displayName={displayName} roomName={roomUrl} />;
};

export const WithPreCall = ({ roomUrl, displayName }: { roomUrl: string; displayName?: string }) => {
    const [localStream] = useLocalMedia();
    const [shouldJoin, setShouldJoin] = useState(false);

    if (!roomUrl || !roomUrl.match(roomRegEx)) {
        return <p>Set room url on the Controls panel</p>;
    }

    return (
        <div>
            {shouldJoin ? (
                <VideoExperience displayName={displayName} roomName={roomUrl} localStream={localStream} />
            ) : (
                <div>{localStream && <VideoElement stream={localStream} />}</div>
            )}
            <button onClick={() => setShouldJoin(!shouldJoin)}>{shouldJoin ? "Leave room" : "Join room"}</button>
        </div>
    );
};
