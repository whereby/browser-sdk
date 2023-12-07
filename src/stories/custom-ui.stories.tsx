import React, { useEffect, useRef, useState } from "react";
import { useReduxLocalMedia, useRoomConnection, VideoView } from "../lib/react";
import PrecallExperience from "./components/PrecallExperience";
import VideoExperience from "./components/VideoExperience";
import fakeWebcamFrame from "../lib/utils/fakeWebcamFrame";
import fakeAudioStream from "../lib/utils/fakeAudioStream";
import "./styles.css";
import ReduxPrecallExperience from "./components/ReduxPrecallExperience";
import Grid from "./components/Grid";

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
    const localMedia = useReduxLocalMedia({ audio: true, video: true });
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
    const localMedia = useReduxLocalMedia();

    return (
        <div>
            <PrecallExperience {...localMedia} />
        </div>
    );
};

export const ReduxLocalMediaOnly = () => {
    const localMedia = useReduxLocalMedia();

    return (
        <div>
            <ReduxPrecallExperience {...localMedia} />
        </div>
    );
};

function LocalMediaWithCanvasStream_({ canvasStream, roomUrl }: { canvasStream: MediaStream; roomUrl: string }) {
    const [shouldConnect, setShouldConnect] = useState(false);

    const localMedia = useReduxLocalMedia(canvasStream);

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
