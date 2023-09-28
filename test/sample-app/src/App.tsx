import React, { useState } from "react";
import { useRoomConnection } from "@whereby.com/browser-sdk";
import "./App.css";

const WaitingArea = ({ knock }: { knock: () => void }) => {
    return (
        <div>
            <h1>Waiting Area</h1>
            <p>Waiting for host to let you in</p>
            <button onClick={knock}>Knock</button>
        </div>
    );
};

type RoomProps = {
    roomUrl: string;
    localMedia: MediaStreamConstraints;
    displayName: string;
    isHost: boolean;
};
const Room = ({ roomUrl, localMedia, displayName, isHost }: RoomProps) => {
    const roomConnection = useRoomConnection(roomUrl, {
        // localMedia: null,
        localMediaConstraints: localMedia,
        displayName,
        logger: console,
    });

    const {
        waitingParticipants,
        remoteParticipants,
        localParticipant,
        // isJoining,
        roomConnectionStatus,
        // chatMessages,
        // mostRecentChatMessage,
        cloudRecording,
        streaming,
        screenshares,
    } = roomConnection.state;
    const {
        acceptWaitingParticipant,
        knock,
        rejectWaitingParticipant,
        // sendChatMessage,
        // toggleCamera,
    } = roomConnection.actions;
    const { VideoView } = roomConnection.components;

    if (roomConnectionStatus === "room_locked") {
        return <WaitingArea knock={knock} />;
    }

    if (roomConnectionStatus === "rejected") {
        return <p>You have been rejected access</p>;
    }

    return (
        <div>
            <h1>Room</h1>
            <dl>
                <dt>Room Connection Status</dt>
                <dd data-testid="roomConnectionStatus">{roomConnectionStatus}</dd>
                <dt>Cloud recording status</dt>
                <dd data-testid="cloudRecordingStatus">{cloudRecording?.status || "N/A"}</dd>
                <dt>Streaming status</dt>
                <dd data-testid="streamingStatus">{streaming?.status || "N/A"}</dd>
            </dl>
            {isHost && waitingParticipants.length > 0 && (
                <div>
                    <h3>Participants in Waiting Area ({waitingParticipants.length})</h3>
                    <ul>
                        {waitingParticipants.map((a) => (
                            <li key={a.id}>
                                <p>{a.displayName}</p>
                                <button onClick={() => acceptWaitingParticipant(a.id)}>Approve</button>
                                <button onClick={() => rejectWaitingParticipant(a.id)}>Reject</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {remoteParticipants.length > 0 && (
                <div>
                    <h3>Remote participants ({remoteParticipants.length})</h3>
                    <div className="RemoteParticipants">
                        {remoteParticipants.map((r) => (
                            <div key={r.id}>
                                {r.stream && <VideoView style={{ width: "250px" }} stream={r.stream} />}
                                <p>{r.displayName}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {screenshares?.length > 0 && (
                <div>
                    <h3>Screenshares ({screenshares.length})</h3>
                    <div className="Screenshares">
                        {screenshares.map((s) => (
                            <div key={s.id || s.participantId}>
                                {s.stream && <VideoView style={{ width: "250px" }} stream={s.stream} />}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {localParticipant && (
                <div className="LocalParticipant">
                    <h3>Local Participant</h3>
                    {localParticipant.stream && (
                        <VideoView style={{ width: "200px" }} stream={localParticipant.stream} />
                    )}
                    <p>{localParticipant.displayName} (you)</p>
                </div>
            )}
        </div>
    );
};

const App = () => {
    const [roomUrlInput, setRoomUrlInput] = useState<string>("");
    const [roomUrl, setRoomUrl] = useState<string | null>(null);

    if (roomUrl === null) {
        return (
            <div>
                <h1>Enter room URL</h1>
                <label>Room URL</label>
                <input type="text" onChange={(e) => setRoomUrlInput(e.target.value)} defaultValue={roomUrlInput} />
                <br />
                <button onClick={() => setRoomUrl(roomUrlInput)}>Enter</button>
            </div>
        );
    }

    const isHost = roomUrl.includes("roomKey=");

    return (
        <div>
            <Room
                roomUrl={roomUrl}
                localMedia={{ audio: false, video: true }}
                displayName={`SDK boy${isHost ? " (host)" : ""}`}
                isHost={isHost}
            />
        </div>
    );
};

export default App;
