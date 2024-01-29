import { Story } from "@storybook/react";
import React, { useEffect, useRef, useState } from "react";
import "../lib/embed";
import type { WherebyEmbedElement } from "../lib/embed";

interface WherebyEmbedAttributes {
    audio: boolean;
    avatarUrl: string;
    background: boolean;
    cameraAccess: boolean;
    chat: boolean;
    displayName: string;
    emptyRoomInvitation: string;
    externalId: string;
    floatSelf: boolean;
    help: boolean;
    leaveButton: boolean;
    logo: boolean;
    people: boolean;
    precallReview: boolean;
    recording: boolean;
    room: string;
    screenshare: boolean;
    video: boolean;
    virtualBackgroundUrl: string;
}

export default {
    title: "Examples/Pre-built UI",
    argTypes: {
        audio: { control: "boolean" },
        avatarUrl: { control: "text", description: "Image url to use for avatar" },
        background: { control: "boolean" },
        cameraAccess: { control: "boolean" },
        chat: { control: "boolean" },
        displayName: { control: "text", description: "The name to use for the local participant" },
        embed: { control: "boolean" },
        emptyRoomInvitation: { control: "boolean" },
        externalId: { control: "text", description: "An external id to use for the local participant" },
        floatSelf: { control: "boolean" },
        help: { control: "boolean" },
        leaveButton: { control: "boolean" },
        locking: { control: "boolean" },
        logo: { control: "boolean" },
        people: { control: "boolean" },
        precallReview: { control: "boolean" },
        recording: { control: "boolean" },
        room: { control: "text" },
        screenshare: { control: "boolean" },
        topToolbar: { control: "boolean" },
        video: { control: "boolean" },
        virtualBackgroundUrl: { control: "text", description: "Image url to use for virtual background" },
    },
};

const offOn = (arg: boolean | string | undefined) => (arg ? "on" : "off");

const WherebyEmbed = ({
    audio,
    avatarUrl,
    background,
    cameraAccess,
    chat,
    displayName,
    emptyRoomInvitation,
    externalId,
    floatSelf,
    help,
    leaveButton,
    logo,
    people,
    precallReview,
    recording,
    room,
    screenshare,
    video,
    virtualBackgroundUrl,
}: Partial<WherebyEmbedAttributes>) => {
    const elmRef = useRef<WherebyEmbedElement>(null);
    const [cameraEnabled, setCameraEnabled] = useState(video);

    useEffect(() => {
        const element = elmRef.current;

        element?.addEventListener("camera_toggle", (e) => {
            const cameraEnabled = e.detail.enabled;
            setCameraEnabled(cameraEnabled);
        });
    }, []);

    return (
        <p>
            <span>Camera: {cameraEnabled ? "ENABLED" : "DISABLED"}</span>
            <whereby-embed
                audio={offOn(audio)}
                avatarUrl={avatarUrl}
                background={offOn(background)}
                cameraAccess={offOn(cameraAccess)}
                chat={offOn(chat)}
                displayName={displayName}
                emptyRoomInvitation={emptyRoomInvitation}
                externalId={externalId}
                floatSelf={offOn(floatSelf)}
                help={offOn(help)}
                leaveButton={offOn(leaveButton)}
                logo={offOn(logo)}
                people={offOn(people)}
                precallReview={offOn(precallReview)}
                recording={offOn(recording)}
                screenshare={offOn(screenshare)}
                video={offOn(video)}
                virtualBackgroundUrl={virtualBackgroundUrl}
                room={room}
                style={{ height: "100vh", width: "100%" }}
                ref={elmRef}
            />
        </p>
    );
};

const Template: Story<Partial<WherebyEmbedAttributes>> = (args) => WherebyEmbed(args);
export const WherebyEmbedElementExample = Template.bind({});

WherebyEmbedElementExample.args = {
    audio: true,
    avatarUrl: "",
    background: true,
    cameraAccess: true,
    chat: true,
    displayName: "Your name",
    emptyRoomInvitation: "true",
    externalId: undefined,
    floatSelf: false,
    help: true,
    leaveButton: true,
    logo: true,
    people: true,
    precallReview: true,
    room: process.env.STORYBOOK_ROOM,
    screenshare: true,
    video: true,
    virtualBackgroundUrl: "",
};

WherebyEmbedElementExample.parameters = {
    docs: {
        transformSource: (src: string) => {
            return (src || "").replace(/><iframe(.+)$/, " />");
        },
    },
};

/*export const Recording = (args) => {
    const el = WherebyEmbed(args);
    el.setAttribute("style", "height: 400px");

    el.addEventListener("recording_status_change", (e) => {
        action("recording_status_change")(e.detail);
    });

    return html`<div>
        ${el}
        <div>
            <button
                @click=${function a() {
                    el.startRecording();
                }}
            >
                Start recording
            </button>
            <button
                @click=${function a() {
                    el.stopRecording();
                }}
            >
                Stop recording
            </button>
        </div>
    </div>`;
};

Recording.args = {
    ...Primary.args,
    recording: "cloud",
};*/
