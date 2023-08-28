import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useLocalMedia } from "../lib/react";
import PrecallExperience from "./components/PrecallExperience";
import VideoExperience from "./components/VideoExperience";
import "./styles.css";

const meta: Meta<typeof VideoExperience> = {
    title: "Examples/Custom UI",
    argTypes: {
        displayName: { control: "text" },
        roomUrl: { control: "text" },
    },
    args: {
        displayName: "SDK",
        roomUrl: process.env.STORYBOOK_ROOM,
    },
};

export default meta;

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

            {shouldJoin && <VideoExperience displayName={displayName} roomUrl={roomUrl} localMedia={localMedia} />}
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

export const RoomConnectionOnly: StoryObj<typeof VideoExperience> = {
    render: ({ roomUrl, displayName }) => {
        if (!roomUrl || !roomUrl.match(roomRegEx)) {
            return <p>Set room url on the Controls panel</p>;
        }

        return (
            <React.StrictMode>
                <VideoExperience displayName={displayName} roomUrl={roomUrl} />
            </React.StrictMode>
        );
    },
};

// Disable docs to make StrictMode work https://github.com/storybookjs/storybook/issues/11554

RoomConnectionOnly.parameters = {
    docs: {
        source: {
            code: "Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554",
        },
    },
};
