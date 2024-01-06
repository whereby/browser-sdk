import { define, ref } from "heresy";
import { parseRoomUrlAndSubdomain } from "./helpers/roomUrl";

const boolAttrs = [
    "audio",
    "background",
    "cameraAccess",
    "chat",
    "people",
    "embed",
    "emptyRoomInvitation",
    "help",
    "leaveButton",
    "precallReview",
    "screenshare",
    "video",
    "floatSelf",
    "recording",
    "logo",
    "locking",
    "participantCount",
    "settingsButton",
    "pipButton",
    "moreButton",
    "personality",
    "subgridLabels",
    "lowData",
    "breakout",
];

define("WherebyEmbed", {
    oninit() {
        this.iframe = ref();
    },
    onconnected() {
        window.addEventListener("message", this);
    },
    ondisconnected() {
        window.removeEventListener("message", this);
    },
    observedAttributes: [
        "displayName",
        "minimal",
        "room",
        "subdomain",
        "lang",
        "metadata",
        "groups",
        "virtualBackgroundUrl",
        "avatarUrl",
        "externalId",
        "title",
        ...boolAttrs,
    ].map((a) => a.toLowerCase()),
    onattributechanged({ attributeName, oldValue }) {
        if (["room", "subdomain"].includes(attributeName) && oldValue == null) return;
        this.render();
    },
    style(self) {
        return `
    ${self} {
      display: block;
    }
    ${self} iframe {
      border: none;
      height: 100%;
      width: 100%;
    }
    `;
    },

    // Commands
    _postCommand(command, args = []) {
        if (this.iframe.current) {
            this.iframe.current.contentWindow.postMessage({ command, args }, this.roomUrl.origin);
        }
    },
    startRecording() {
        this._postCommand("start_recording");
    },
    stopRecording() {
        this._postCommand("stop_recording");
    },
    startStreaming() {
        this._postCommand("start_streaming");
    },
    stopStreaming() {
        this._postCommand("stop_streaming");
    },
    toggleCamera(enabled) {
        this._postCommand("toggle_camera", [enabled]);
    },
    toggleMicrophone(enabled) {
        this._postCommand("toggle_microphone", [enabled]);
    },
    toggleScreenshare(enabled) {
        this._postCommand("toggle_screenshare", [enabled]);
    },
    toggleChat(enabled) {
        this._postCommand("toggle_chat", [enabled]);
    },

    onmessage({ origin, data }) {
        if (!this.roomUrl || origin !== this.roomUrl.origin) return;
        const { type, payload: detail } = data;
        this.dispatchEvent(new CustomEvent(type, { detail }));
    },
    render() {
        const {
            avatarurl: avatarUrl,
            displayname: displayName,
            lang,
            metadata,
            externalid: externalId,
            minimal,
            room,
            groups,
            virtualbackgroundurl: virtualBackgroundUrl,
            title,
        } = this;
        let roomUrl, subdomain;

        try {
            ({ roomUrl, subdomain } = parseRoomUrlAndSubdomain(room, this.subdomain));
        } catch (error) {
            return this.html`Whereby: ${error.message}`;
        }

        this.roomUrl = roomUrl;

        Object.entries({
            jsApi: true,
            we: "__SDK_VERSION__",
            iframeSource: subdomain,
            ...(displayName && { displayName }),
            ...(lang && { lang: lang }),
            ...(metadata && { metadata: metadata }),
            ...(externalId && { externalId }),
            ...(groups && { groups: groups }),
            ...(virtualBackgroundUrl && { virtualBackgroundUrl: virtualBackgroundUrl }),
            ...(avatarUrl && { avatarUrl: avatarUrl }),
            // the original ?embed name was confusing, so we give minimal
            ...(minimal != null && { embed: minimal }),
            ...boolAttrs.reduce(
                // add to URL if set in any way
                (o, v) => (this[v.toLowerCase()] != null ? { ...o, [v]: this[v.toLowerCase()] } : o),
                {}
            ),
        }).forEach(([k, v]) => {
            if (!this.roomUrl.searchParams.has(k)) {
                this.roomUrl.searchParams.set(k, v);
            }
        });
        this.html`
      <iframe
        title=${title || "Video calling component"}
        ref=${this.iframe}
        src=${this.roomUrl}
        allow="autoplay; camera; microphone; fullscreen; speaker; display-capture" />
      `;
    },
});

export default { sdkVersion: "__SDK_VERSION__" };
