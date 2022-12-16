import { define, ref } from "heresy";

const boolAttrs = [
    "audio",
    "background",
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
    onattributechanged({ attributeName, oldValue }: { attributeName: string; oldValue: any }) {
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
    toggleCamera(enabled: boolean) {
        this._postCommand("toggle_camera", [enabled]);
    },
    toggleMicrophone(enabled: boolean) {
        this._postCommand("toggle_microphone", [enabled]);
    },

    onmessage({ origin, data }: { origin: string; data: any }) {
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
        if (!room) return this.html`Whereby: Missing room attribute.`;
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
            if (!url.searchParams.has(k) && typeof v === "string") {
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
