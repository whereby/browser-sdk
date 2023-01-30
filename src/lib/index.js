import { define, ref } from "heresy";

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
            const url = new URL(this.room, `https://${this.subdomain}.whereby.com`);
            this.iframe.current.contentWindow.postMessage({ command, args }, url.origin);
        }
    },
    startRecording() {
        this._postCommand("start_recording");
    },
    stopRecording() {
        this._postCommand("stop_recording");
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

    onmessage({ origin, data }) {
        const url = new URL(this.room, `https://${this.subdomain}.whereby.com`);
        if (origin !== url.origin) return;
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
        if (!room) return this.html`Whereby: Missing room attr.`;
        // Get subdomain from room URL, or use it specified
        let m = /https:\/\/([^.]+)\.whereby.com\/.+/.exec(room);
        const subdomain = (m && m[1]) || this.subdomain;
        if (!subdomain) return this.html`Whereby: Missing subdomain attr.`;
        const url = new URL(room, `https://${subdomain}.whereby.com`);
        Object.entries({
            jsApi: true,
            we: "__SDK_VERSION__",
            iframeSource: subdomain,
            ...(displayName && { displayName }),
            ...(lang && { lang: lang }),
            ...(metadata && { metadata: metadata }),
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
            if (!url.searchParams.has(k)) {
                url.searchParams.set(k, v);
            }
        });
        this.html`
      <iframe
        ref=${this.iframe}
        src=${url}
        allow="autoplay; camera; microphone; fullscreen; speaker; display-capture" />
      `;
    },
});

export default { sdkVersion: "__SDK_VERSION__" };
