import { html } from "lit-html";
import { action } from "@storybook/addon-actions";

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
    style,
    video,
    virtualBackgroundUrl,
}) => {
    const el = document.createElement("whereby-embed");

    el.setAttribute("audio", offOn(audio));
    el.setAttribute("avatarUrl", avatarUrl);
    el.setAttribute("background", offOn(background));
    el.setAttribute("cameraAccess", offOn(cameraAccess));
    el.setAttribute("chat", offOn(chat));
    el.setAttribute("displayName", displayName);
    el.setAttribute("emptyRoomInvitation", emptyRoomInvitation);
    el.setAttribute("floatSelf", offOn(floatSelf));
    el.setAttribute("help", offOn(help));
    el.setAttribute("leaveButton", offOn(leaveButton));
    el.setAttribute("logo", offOn(logo));
    el.setAttribute("people", offOn(people));
    el.setAttribute("precallReview", offOn(precallReview));
    el.setAttribute("recording", recording);
    el.setAttribute("screenshare", offOn(screenshare));
    el.setAttribute("video", offOn(video));
    el.setAttribute("virtualBackgroundUrl", virtualBackgroundUrl);
    el.setAttribute("room", room);
    el.setAttribute("style", style);

    return el;
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
    style: "height: 100vh",
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

export const Recording = (args) => {
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
};
