import React, { useEffect, useRef, useState } from "react";
import { useLocalMedia, UseLocalMediaResult, useRoomConnection, VideoView } from "../lib/react";
import PrecallExperience from "./components/PrecallExperience";
import VideoExperience from "./components/VideoExperience";
import fakeWebcamFrame from "../lib/utils/fakeWebcamFrame";
import fakeAudioStream from "../lib/utils/fakeAudioStream";
import "./styles.css";
import Grid from "./components/Grid";
import { Grid as VideoGrid } from "../lib/react/Grid";

export default {
    title: "Examples/Custom UI",
    argTypes: {
        displayName: { control: "text" },
        roomUrl: { control: "text", type: { required: true } },
    },
    args: {
        displayName: "SDK",
        roomUrl: process.env.STORYBOOK_ROOM,
    },
};

const roomRegEx = new RegExp(/^https:\/\/.*\/.*/);

export const StartStop = () => {
    return <div>Go to this story to eg verify all resources (camera, microphone, connections) are released.</div>;
};

export const RoomConnectionWithLocalMedia = ({ roomUrl, displayName }: { roomUrl: string; displayName?: string }) => {
    const localMedia = useLocalMedia({ audio: true, video: true });
    const [shouldJoin, setShouldJoin] = useState(false);

    if (!roomUrl || !roomUrl.match(roomRegEx)) {
        return <p>Set room url on the Controls panel</p>;
    }

    return (
        <div>
            <PrecallExperience {...localMedia} hideVideoPreview={shouldJoin} />
            <button onClick={() => setShouldJoin(!shouldJoin)}>{shouldJoin ? "Leave room" : "Join room"}</button>

            {shouldJoin && <VideoExperience displayName={displayName} roomName={roomUrl} localMedia={localMedia} />}
        </div>
    );
};

export const LocalMediaOnly = () => {
    const localMedia = useLocalMedia({ audio: true, video: true });

    return (
        <div>
            <PrecallExperience {...localMedia} />
        </div>
    );
};

function CanvasInRoom({ localMedia, roomUrl }: { localMedia: UseLocalMediaResult; roomUrl: string }) {
    const { state } = useRoomConnection(roomUrl, { localMedia });

    return <div>Room connection status: {state.connectionStatus}</div>;
}

function LocalMediaWithCanvasStream_({ canvasStream, roomUrl }: { canvasStream: MediaStream; roomUrl: string }) {
    const [shouldConnect, setShouldConnect] = useState(false);

    const localMedia = useLocalMedia(canvasStream);

    return (
        <div>
            {localMedia.state.localStream && (
                <div>
                    <h3>Connect to room</h3>
                    <h4>Local media (self-view)</h4>
                    <VideoView stream={localMedia.state.localStream} />
                </div>
            )}
            <button onClick={() => setShouldConnect(!shouldConnect)}>
                {shouldConnect ? "Disconnect" : "Connect to room"}
            </button>
            {shouldConnect && <CanvasInRoom localMedia={localMedia} roomUrl={roomUrl} />}
        </div>
    );
}

export const LocalMediaWithFakeMediaStream = ({ roomUrl }: { roomUrl: string }) => {
    const canvas = useRef<HTMLCanvasElement>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isAudioReady, setIsAudioReady] = useState(false);

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

    function addAudioTrack() {
        if (localStream) {
            const audioStream = fakeAudioStream();
            localStream.addTrack(audioStream.getAudioTracks()[0]);
            setLocalStream(localStream.clone());
            setIsAudioReady(true);
        }
    }

    return (
        <div>
            {localStream && isAudioReady && (
                <div>
                    <LocalMediaWithCanvasStream_ canvasStream={localStream} roomUrl={roomUrl} />{" "}
                </div>
            )}
            <div style={{ display: localStream && isAudioReady ? "none" : "block" }}>
                <h3>Set up fake media stream</h3>
                <p>
                    We create a fake webcam stream using an HTML canvas element and a fake audio stream using Web Audio
                    API.
                </p>
                <p>Adding the audio track needs a user interaction, so please click the button below.</p>
                {localStream ? (
                    <button onClick={addAudioTrack}>Add fake audio track</button>
                ) : (
                    <div>Waiting for canvas to be loaded</div>
                )}
                <br />
                <canvas ref={canvas} id="canvas" width="640" height="360"></canvas>
            </div>
        </div>
    );
};

export const RoomConnectionOnly = ({ roomUrl, displayName }: { roomUrl: string; displayName?: string }) => {
    if (!roomUrl || !roomUrl.match(roomRegEx)) {
        return <p>Set room url on the Controls panel</p>;
    }

    return <VideoExperience displayName={displayName} roomName={roomUrl} />;
};

export const ResolutionReporting = ({ roomUrl }: { roomUrl: string; displayName?: string }) => {
    if (!roomUrl || !roomUrl.match(roomRegEx)) {
        return <p>Set room url on the Controls panel</p>;
    }

    const roomConnection = useRoomConnection(roomUrl, { localMediaOptions: { audio: false, video: false } });

    return <Grid roomConnection={roomConnection} />;
};

export const RoomConnectionStrictMode = ({ roomUrl, displayName }: { roomUrl: string; displayName?: string }) => {
    if (!roomUrl || !roomUrl.match(roomRegEx)) {
        return <p>Set room url on the Controls panel</p>;
    }

    return (
        <React.StrictMode>
            <VideoExperience displayName={displayName} roomName={roomUrl} />
        </React.StrictMode>
    );
};

RoomConnectionStrictMode.parameters = {
    docs: {
        source: {
            code: "Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554",
        },
    },
};

export const GridStory = ({ roomUrl }: { roomUrl: string; displayName?: string }) => {
    if (!roomUrl || !roomUrl.match(roomRegEx)) {
        return <p>Set room url on the Controls panel</p>;
    }

    const roomConnection = useRoomConnection(roomUrl, { localMediaOptions: { audio: false, video: true } });

    return (
        <div style={{ height: "100vh" }}>
            <VideoGrid roomConnection={roomConnection} videoGridGap={10} />
        </div>
    );
};

export const GridWithCustomVideosStory = ({ roomUrl }: { roomUrl: string; displayName?: string }) => {
    if (!roomUrl || !roomUrl.match(roomRegEx)) {
        return <p>Set room url on the Controls panel</p>;
    }

    const roomConnection = useRoomConnection(roomUrl, { localMediaOptions: { audio: false, video: true } });

    return (
        <div style={{ height: "100vh" }}>
            <VideoGrid
                roomConnection={roomConnection}
                videoGridGap={10}
                renderParticipant={({ participant }) => {
                    if (!participant.stream) {
                        return null;
                    }

                    return (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "100%",
                            }}
                        >
                            <VideoView
                                style={{
                                    border: "4px dashed red",
                                    boxSizing: "border-box",
                                    borderRadius: "100%",
                                    objectFit: "cover",
                                    width: "60%",
                                }}
                                stream={participant.stream}
                            />
                            <p>{participant.displayName}</p>
                        </div>
                    );
                }}
            />
        </div>
    );
};
