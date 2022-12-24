import { Story } from "@storybook/react";
import React, { useState } from "react";
import { useRoomConnection, VideoElement } from "../lib/react";

export default {
    title: "Examples/Custom UI",
};

const Template: Story = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [roomName, setRoomName] = useState("");

    const VideoExperience = ({ roomName }: { roomName: string }) => {
        const [{ localParticipant, remoteParticipants }] = useRoomConnection(roomName, {
            localMediaConstraints: {
                audio: true,
                video: true,
            },
            logger: console,
        });
        return (
            <div style={{ minHeight: 400, backgroundColor: "pink" }}>
                {[localParticipant, ...remoteParticipants].map((participant, i) => (
                    <>
                        {participant ? (
                            <div
                                key={participant.id}
                                className="bouncingball"
                                style={{ animationDelay: `${Math.random() * 1000}ms`, left: i * 145 }}
                            >
                                {participant.stream && (
                                    <VideoElement
                                        stream={participant.stream}
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                )}
                            </div>
                        ) : null}
                    </>
                ))}
            </div>
        );
    };

    return (
        <div>
            {!isConnected ? (
                <div>
                    <label>Room name</label>
                    <input type="text" value={roomName} onChange={(e) => setRoomName(e.target.value)} />
                    <button onClick={() => setIsConnected(true)}>Connect</button>
                </div>
            ) : (
                <VideoExperience roomName={roomName} />
            )}
        </div>
    );
};
export const ViewOnly = Template.bind({});
