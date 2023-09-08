import RtcManager from "@whereby/jslib-media/src/webrtc/RtcManager";

type CameraEnabledEvent = {
    enabled: boolean;
};
type MicrophoneEnabledEvent = {
    enabled: boolean;
};
type DeviceListUpdatedEvent = {
    cameraDevices: MediaDeviceInfo[];
    microphoneDevices: MediaDeviceInfo[];
    speakerDevices: MediaDeviceInfo[];
};
type DeviceListUpdateErrorEvent = {
    error: unknown;
};
type StreamUpdatedEvent = {
    stream: MediaStream;
};

interface LocalMediaEventsMap {
    camera_enabled: CustomEvent<CameraEnabledEvent>;
    device_list_updated: CustomEvent<DeviceListUpdatedEvent>;
    device_list_update_error: CustomEvent<DeviceListUpdateErrorEvent>;
    microphone_enabled: CustomEvent<MicrophoneEnabledEvent>;
    stream_updated: CustomEvent<StreamUpdatedEvent>;
}

interface LocalMediaEventTarget extends EventTarget {
    addEventListener<K extends keyof LocalMediaEventsMap>(
        type: K,
        listener: (ev: LocalMediaEventsMap[K]) => void,
        options?: boolean | AddEventListenerOptions
    ): void;
    addEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: EventListenerOptions | boolean
    ): void;
}

const TypedLocalMediaEventTarget = EventTarget as { new (): LocalMediaEventTarget };

export default class LocalMedia extends TypedLocalMediaEventTarget {
    private _constraints: MediaStreamConstraints;
    public _rtcManagers: RtcManager[];
    public stream: MediaStream;
    public screenshareStream?: MediaStream;

    constructor(constraints: MediaStreamConstraints) {
        super();
        this._constraints = constraints;
        this.stream = new MediaStream();
        this._rtcManagers = [];
        this.screenshareStream = undefined;

        navigator.mediaDevices.addEventListener("devicechange", this._updateDeviceList.bind(this));
    }

    addRtcManager(rtcManager: RtcManager) {
        this._rtcManagers.push(rtcManager);
    }

    removeRtcManager(rtcManager: RtcManager) {
        this._rtcManagers = this._rtcManagers.filter((r) => r !== rtcManager);
    }

    getCameraDeviceId() {
        return this.stream.getVideoTracks()[0]?.getSettings().deviceId;
    }

    getMicrophoneDeviceId() {
        return this.stream.getAudioTracks()[0]?.getSettings().deviceId;
    }

    isCameraEnabled() {
        return !!this.stream.getVideoTracks()[0]?.enabled;
    }

    isMicrophoneEnabled() {
        return !!this.stream.getAudioTracks()[0]?.enabled;
    }

    toggleCameraEnabled(enabled?: boolean) {
        const videoTrack = this.stream.getVideoTracks()[0];
        if (!videoTrack) {
            return;
        }

        const newValue = enabled ?? !videoTrack.enabled;
        videoTrack.enabled = newValue;

        this.dispatchEvent(new CustomEvent("camera_enabled", { detail: { enabled: newValue } }));
    }

    toggleMichrophoneEnabled(enabled?: boolean) {
        const audioTrack = this.stream.getAudioTracks()[0];
        if (!audioTrack) {
            return;
        }

        const newValue = enabled ?? !audioTrack.enabled;
        audioTrack.enabled = newValue;

        this.dispatchEvent(new CustomEvent("microphone_enabled", { detail: { enabled: newValue } }));
    }

    async startScreenshare() {
        if (this.screenshareStream) {
            return this.screenshareStream;
        }
        const screenshareStream = await navigator.mediaDevices.getDisplayMedia();
        this.screenshareStream = screenshareStream;
        return this.screenshareStream;
    }

    stopScreenshare() {
        this.screenshareStream?.getTracks().forEach((track) => track.stop());
        this.screenshareStream = undefined;
    }

    async setCameraDevice(deviceId: string) {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId } });
        const newVideoTrack = newStream.getVideoTracks()[0];

        if (newVideoTrack) {
            const oldVideoTrack = this.stream.getVideoTracks()[0];
            newVideoTrack.enabled = oldVideoTrack.enabled;
            oldVideoTrack?.stop();

            this._rtcManagers.forEach((rtcManager) => {
                rtcManager.replaceTrack(oldVideoTrack, newVideoTrack);
            });

            this.stream.removeTrack(oldVideoTrack);
            this.stream.addTrack(newVideoTrack);
        }

        this.dispatchEvent(
            new CustomEvent("stream_updated", {
                detail: { stream: this.stream },
            })
        );
    }

    async setMicrophoneDevice(deviceId: string) {
        const newStream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId } });
        const newAudioTrack = newStream.getAudioTracks()[0];
        const oldAudioTrack = this.stream.getAudioTracks()[0];

        if (oldAudioTrack) {
            newAudioTrack.enabled = oldAudioTrack.enabled;
            oldAudioTrack.stop();
            this.stream.removeTrack(oldAudioTrack);
        }

        this._rtcManagers.forEach((rtcManager) => {
            rtcManager.replaceTrack(oldAudioTrack, newAudioTrack);
        });
        this.stream.addTrack(newAudioTrack);

        this.dispatchEvent(
            new CustomEvent("stream_updated", {
                detail: { stream: this.stream },
            })
        );
    }

    private async _updateDeviceList() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.dispatchEvent(
                new CustomEvent("device_list_updated", {
                    detail: {
                        cameraDevices: devices.filter((d) => d.kind === "videoinput"),
                        microphoneDevices: devices.filter((d) => d.kind === "audioinput"),
                        speakerDevices: devices.filter((d) => d.kind === "audiooutput"),
                    },
                })
            );
        } catch (error) {
            this.dispatchEvent(
                new CustomEvent("device_list_update_error", {
                    detail: {
                        error,
                    },
                })
            );
            throw error;
        }
    }

    async start() {
        const newStream = await navigator.mediaDevices.getUserMedia(this._constraints);
        newStream.getTracks().forEach((t) => this.stream.addTrack(t));

        this._updateDeviceList();

        this.dispatchEvent(
            new CustomEvent("stream_updated", {
                detail: { stream: this.stream },
            })
        );
        return this.stream;
    }

    stop() {
        this.stream?.getTracks().forEach((t) => {
            t.stop();
        });
    }
}
