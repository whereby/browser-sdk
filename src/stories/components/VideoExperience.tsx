import React from "react";
import DisplayNameForm from "./DisplayNameForm";
import { LocalMediaRef } from "../../lib/react/useLocalMedia";
import useRoomConnection from "../../lib/react/useRoomConnection";

export default function VideoExperience({
    displayName,
    roomName,
    localMedia,
}: {
    displayName?: string;
    roomName: string;
    localMedia?: LocalMediaRef;
}) {
    const { state, actions, components } = useRoomConnection(roomName, {
        displayName,
        localMediaConstraints: {
            audio: true,
            video: true,
        },
        localMedia,
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
                                            muted={participant.isLocalParticipant}
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
}
