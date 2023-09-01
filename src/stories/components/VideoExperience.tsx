import React, { useState } from "react";
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
    const [chatMessage, setChatMessage] = useState("");
    const { state, actions, components } = useRoomConnection(roomName, {
        displayName,
        localMediaConstraints: {
            audio: true,
            video: true,
        },
        localMedia,
        logger: console,
    });

    const { localParticipant, mostRecentChatMessage, remoteParticipants, roomConnectionStatus, waitingParticipants } =
        state;
    const {
        knock,
        sendChatMessage,
        setDisplayName,
        toggleCamera,
        toggleMicrophone,
        acceptWaitingParticipant,
        rejectWaitingParticipant,
        startScreenshare,
    } = actions;
    const { VideoView } = components;

    return (
        <div>
            {roomConnectionStatus === "connecting" && <span>Connecting...</span>}
            {roomConnectionStatus === "room_locked" && (
                <div style={{ color: "red" }}>
                    <span>Room locked, please knock....</span>
                    <button onClick={() => knock()}>Knock</button>
                </div>
            )}
            {roomConnectionStatus === "knocking" && <span>Knocking...</span>}
            {roomConnectionStatus === "rejected" && <span>Rejected :(</span>}
            {roomConnectionStatus === "connected" && (
                <>
                    <div className="chat">
                        <div className="last_message">{mostRecentChatMessage?.text}</div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                sendChatMessage(chatMessage);
                                setChatMessage("");
                            }}
                        >
                            <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} />
                            <button type="submit">Send message</button>
                        </form>
                    </div>
                    <div className="waiting_room">
                        <h2>Waiting room</h2>
                        {waitingParticipants.map((p) => {
                            return (
                                <div key={p.id}>
                                    Waiting: {p.displayName || "unknown"} {p.id}
                                    <button onClick={() => acceptWaitingParticipant(p.id)}>Accept</button>
                                    <button onClick={() => rejectWaitingParticipant(p.id)}>Reject</button>
                                </div>
                            );
                        })}
                    </div>
                    <div className="container">
                        {[localParticipant, ...remoteParticipants].map((participant, i) => (
                            <div className="participantWrapper" key={participant?.id || i}>
                                {participant ? (
                                    <>
                                        <div
                                            className="bouncingball"
                                            style={{
                                                animationDelay: `1000ms`,
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
                        <button onClick={() => startScreenshare()}>Start screenshare</button>
                    </div>
                </>
            )}
        </div>
    );
}
