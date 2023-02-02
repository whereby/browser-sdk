import { Story } from "@storybook/react";
import React from "react";
import "../lib";

interface WherebyEmbedAttributes {
    audio: boolean;
    avatarUrl: string;
    background: boolean;
    chat: boolean;
    displayName: string;
    emptyRoomInvitation: string;
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
        chat: { control: "boolean" },
        displayName: { control: "text", description: "The name to use for the local participant" },
        embed: { control: "boolean" },
        emptyRoomInvitation: { control: "boolean" },
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
    chat,
    displayName,
    emptyRoomInvitation,
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
    return (
        <p>
            <whereby-embed
                audio={offOn(audio)}
                avatarUrl={avatarUrl}
                background={offOn(background)}
                chat={offOn(chat)}
                displayName={displayName}
                emptyRoomInvitation={emptyRoomInvitation}
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
            />
        </p>
    );
};

const Template: Story<Partial<WherebyEmbedAttributes>> = (args) => WherebyEmbed(args);
export const WherebyEmbedElement = Template.bind({});

WherebyEmbedElement.args = {
    audio: true,
    avatarUrl: "",
    background: true,
    chat: true,
    displayName: "Your name",
    emptyRoomInvitation: "true",
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

WherebyEmbedElement.parameters = {
    docs: {
        transformSource: (src: string) => {
            return (src || "").replace(/><iframe(.+)$/, " />");
        },
    },
};
