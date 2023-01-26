import { html } from "lit-html";
import "./lib";

export default {
    title: "Examples/<whereby-embed>",
    argTypes: {
        audio: { control: "boolean" },
        avatarUrl: { control: "text", description: "Image url to use for avatar" },
        background: { control: "boolean" },
        cameraAccess: { control: "boolean" },
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

const offOn = (arg) => (arg ? "on" : "off");

const WherebyEmbed = ({
    audio,
    avatarUrl,
    background,
    cameraAccess,
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
}) => {
    return html`<whereby-embed
        audio=${offOn(audio)}
        avatarUrl=${avatarUrl}
        background=${offOn(background)}
        cameraAccess=${offOn(cameraAccess)}
        chat=${offOn(chat)}
        displayName=${displayName}
        emptyRoomInvitation=${emptyRoomInvitation}
        floatSelf=${offOn(floatSelf)}
        help=${offOn(help)}
        leaveButton=${offOn(leaveButton)}
        logo=${offOn(logo)}
        people=${offOn(people)}
        precallReview=${offOn(precallReview)}
        recording=${offOn(recording)}
        screenshare=${offOn(screenshare)}
        video=${offOn(video)}
        virtualBackgroundUrl=${virtualBackgroundUrl}
        room="${room}"
        style="height: 100vh"
    />`;
};

const Template = (args) => WherebyEmbed(args);
export const Primary = Template.bind({});

Primary.args = {
    audio: true,
    avatarUrl: "",
    background: true,
    cameraAccess: true,
    chat: true,
    displayName: "Your name",
    emptyRoomInvitation: true,
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

Primary.parameters = {
    docs: {
        transformSource: (src) => {
            return (src || "").replace(/><iframe(.+)$/, " />");
        },
    },
};
