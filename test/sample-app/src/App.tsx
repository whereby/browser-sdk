import React, { useEffect, useRef, useState } from "react";
import { useRoomConnection, useLocalMedia, fakeAudioStream, fakeWebcamFrame } from "@whereby.com/browser-sdk";
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

type LocalMediaRef = ReturnType<typeof useLocalMedia>;

type RoomProps = {
    roomUrl: string;
    localMedia: LocalMediaRef;
    displayName: string;
    isHost: boolean;
};
const Room = ({ roomUrl, localMedia, displayName, isHost }: RoomProps) => {
    const roomConnection = useRoomConnection(roomUrl, {
        localMedia,
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
        startScreenshare,
        stopScreenshare,
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
            <div className="Controls">
                <button data-testid="startScreenshareBtn" onClick={() => startScreenshare()}>
                    Start screen share
                </button>
                <button data-testid="stopScreenshareBtn" onClick={() => stopScreenshare()}>
                    Stop screen share
                </button>
            </div>
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
                    <div className="RemoteParticipants" data-testid="remote-participant-list">
                        {remoteParticipants.map((r) => (
                            <div key={r.id}>
                                {r.stream && (
                                    <VideoView
                                        style={{ width: "250px" }}
                                        stream={r.stream}
                                        data-testid="remoteParticipant"
                                    />
                                )}
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
                                {s.stream && (
                                    <VideoView style={{ width: "250px" }} stream={s.stream} data-testid="screenShare" />
                                )}
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

const CanvasWrapper = ({ roomUrl, canvasStream }: { roomUrl: string; canvasStream: MediaStream }) => {
    const localMedia = useLocalMedia(canvasStream);
    const isHost = roomUrl.includes("roomKey=");

    return (
        <Room
            roomUrl={roomUrl}
            localMedia={localMedia}
            displayName={`SDK boy${isHost ? " (host)" : ""}`}
            isHost={isHost}
        />
    );
};

const App = () => {
    const [roomUrlInput, setRoomUrlInput] = useState<string>("");
    const [roomUrl, setRoomUrl] = useState<string | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const canvas = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvas.current) {
            fakeWebcamFrame(canvas.current);
        }
    }, [canvas]);

    useEffect(() => {
        setTimeout(() => {
            if (canvas.current) {
                setLocalStream(canvas.current.captureStream());
            }
        }, 1000);
    }, [canvas]);

    function toggleFakeAudio() {
        if (!localStream) {
            return;
        }
        if (localStream.getAudioTracks().length > 0) {
            localStream.getAudioTracks()[0].stop();
            localStream.removeTrack(localStream.getAudioTracks()[0]);
        } else {
            const audioStream = fakeAudioStream();
            localStream.addTrack(audioStream.getAudioTracks()[0]);
        }
        setLocalStream(localStream.clone());
    }

    return (
        <div>
            {roomUrl ? (
                localStream ? (
                    <CanvasWrapper roomUrl={roomUrl} canvasStream={localStream} />
                ) : (
                    <p>loading</p>
                )
            ) : (
                <div>
                    <h1>Enter room URL</h1>
                    <label>Room URL</label>
                    <input type="text" onChange={(e) => setRoomUrlInput(e.target.value)} defaultValue={roomUrlInput} />
                    <br />
                    <button onClick={() => setRoomUrl(roomUrlInput)}>Enter</button>
                </div>
            )}

            <hr />
            <div className="LocalStreamCanvas">
                <h3>Canvas for local stream</h3>
                {!roomUrl && (
                    <button onClick={toggleFakeAudio} data-testid="toggleFakeAudio">
                        Toggle fake audio
                    </button>
                )}
                {localStream && (
                    <dl data-testid="fakeMediaStats">
                        <dt>Audio track</dt>
                        <dd data-testid="fakeAudioTrackStatus">
                            {localStream.getAudioTracks().length ? "ready" : "missing"}
                        </dd>
                        <dt>Video track</dt>
                        <dd data-testid="fakeWebcamStatus">
                            {localStream.getVideoTracks().length ? "ready" : "missing"}
                        </dd>
                    </dl>
                )}
                <br />
                <canvas ref={canvas} width="640" height="360" />
            </div>
        </div>
    );
};

export default App;