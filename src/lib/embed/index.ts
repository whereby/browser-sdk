import { define, ref } from "heresy";

interface WherebyEmbedAttributes {
    audio: string;
    avatarUrl: string;
    background: string;
    cameraAccess: string;
    chat: string;
    displayName: string;
    emptyRoomInvitation: string;
    floatSelf: string;
    help: string;
    leaveButton: string;
    logo: string;
    people: string;
    precallReview: string;
    recording: string;
    screenshare: string;
    video: string;
    virtualBackgroundUrl: string;
    room: string;
    style: { [key: string]: string };
}
declare global {
    namespace JSX {
        interface IntrinsicElements {
            ["whereby-embed"]: Partial<WherebyEmbedAttributes>;
        }
    }
}

const boolAttrs = [
    "audio",
    "background",
    "cameraaccess",
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
        window.addEventListener("message", this.onmessage);
    },
    ondisconnected() {
        window.removeEventListener("message", this.onmessage);
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
        ...boolAttrs,
    ].map((a) => a.toLowerCase()),
    onattributechanged({ attributeName, oldValue }: { attributeName: string; oldValue: string | boolean }) {
        if (["room", "subdomain"].includes(attributeName) && oldValue == null) return;
        this.render();
    },
    style(self: string) {
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
    _postCommand(command: string, args = []) {
        if (this.iframe.current) {
            this.iframe.current.contentWindow.postMessage({ command, args }, this.url.origin);
        }
    },
    startRecording() {
        this._postCommand("start_recording");
    },
    stopRecording() {
        this._postCommand("stop_recording");
    },
    toggleCamera(enabled: boolean) {
        this._postCommand("toggle_camera", [enabled]);
    },
    toggleMicrophone(enabled: boolean) {
        this._postCommand("toggle_microphone", [enabled]);
    },
    toggleScreenshare(enabled: boolean) {
        this._postCommand("toggle_screenshare", [enabled]);
    },
    onmessage({ origin, data }: { origin: string; data: { type: string; payload: string } }) {
        if (origin !== this.url?.origin) return;
        const { type, payload: detail } = data;
        this.dispatchEvent(new CustomEvent(type, { detail }));
    },
    render() {
        const {
            avatarurl: avatarUrl,
            displayname: displayName,
            lang,
            metadata,
            minimal,
            room,
            groups,
            virtualbackgroundurl: virtualBackgroundUrl,
        } = this;
        if (!room) return this.html`Whereby: Missing room attribute.`;
        // Get subdomain from room URL, or use it specified
        const m = /https:\/\/([^.]+)(\.whereby.com|-ip-\d+-\d+-\d+-\d+.hereby.dev:4443)\/.+/.exec(room);
        const subdomain = (m && m[1]) || this.subdomain;
        if (!subdomain) return this.html`Whereby: Missing subdomain attr.`;
        if (!m) {
            return this.html`could not parse URL.`;
        }
        const baseURL = m[2] || `.whereby.com`;
        this.url = new URL(room, `https://${subdomain}${baseURL}`);
        const roomUrl = new URL(room);
        if (roomUrl.searchParams.get("roomKey")) {
            this.url.searchParams.append("roomKey", roomUrl.searchParams.get("roomKey"));
        }
        Object.entries({
            jsApi: true,
            we: "__SDK_VERSION__",
            iframeSource: subdomain,
            ...(displayName && { displayName }),
            ...(lang && { lang }),
            ...(metadata && { metadata }),
            ...(groups && { groups }),
            ...(virtualBackgroundUrl && { virtualBackgroundUrl }),
            ...(avatarUrl && { avatarUrl }),
            // the original ?embed name was confusing, so we give minimal
            ...(minimal != null && { embed: minimal }),
            ...boolAttrs.reduce(
                // add to URL if set in any way
                (o, v) => (this[v.toLowerCase()] != null ? { ...o, [v]: this[v.toLowerCase()] } : o),
                {}
            ),
        }).forEach(([k, v]) => {
            if (!this.url.searchParams.has(k) && typeof v === "string") {
                this.url.searchParams.set(k, v);
            }
        });
        return this.html`
        <iframe
            ref=${this.iframe}
            src=${this.url}
            allow="autoplay; camera; microphone; fullscreen; speaker; display-capture" />
        `;
    },
});
