import React, { useState } from "react";
import { useLocalMedia } from "../lib/react";
import PrecallExperience from "./components/PrecallExperience";
import VideoExperience from "./components/VideoExperience";
import "./styles.css";

export default {
    title: "Examples/Custom UI",
    argTypes: {
        displayName: { control: "text", defaultValue: "SDK" },
        roomUrl: { control: "text", defaultValue: process.env.STORYBOOK_ROOM, type: { required: true } },
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

export const RoomConnectionOnly = ({ roomUrl, displayName }: { roomUrl: string; displayName?: string }) => {
    if (!roomUrl || !roomUrl.match(roomRegEx)) {
        return <p>Set room url on the Controls panel</p>;
    }

    return <VideoExperience displayName={displayName} roomName={roomUrl} />;
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
