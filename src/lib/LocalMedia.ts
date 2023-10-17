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
    private _constraints: MediaStreamConstraints | null = null;
    public _rtcManagers: RtcManager[];

    public stream: MediaStream;
    public screenshareStream?: MediaStream;

    // Camera state
    private _cameraEnabled: boolean;
    private _currentCameraDeviceId: string | undefined;
    private _isTogglingCameraEnabled = false;

    // Mircophone state
    private _microphoneEnabled: boolean;
    private _currentMicrophoneDeviceId: string | undefined;

    constructor(constraintsOrStream: MediaStreamConstraints | MediaStream) {
        super();

        if (constraintsOrStream instanceof MediaStream) {
            this.stream = constraintsOrStream;
        } else {
            this._constraints = constraintsOrStream;
            this.stream = new MediaStream();
        }

        this._cameraEnabled = this.stream.getVideoTracks()[0]?.enabled || false;
        this._microphoneEnabled = this.stream.getAudioTracks()[0]?.enabled || false;

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
        return this._currentCameraDeviceId;
    }

    getMicrophoneDeviceId() {
        return this._currentMicrophoneDeviceId;
    }

    isCameraEnabled() {
        return this._cameraEnabled;
    }

    isMicrophoneEnabled() {
        return this._microphoneEnabled;
    }

    async toggleCameraEnabled(enabled?: boolean) {
        if (this._isTogglingCameraEnabled) {
            return;
        }

        let track = this.stream.getVideoTracks()[0];
        const newValue = enabled ?? !track?.enabled;
        if (this._cameraEnabled === newValue) {
            return;
        }

        this._cameraEnabled = newValue;
        this.dispatchEvent(new CustomEvent("camera_enabled", { detail: { enabled: this._cameraEnabled } }));

        // Only stop tracks if we fully own the media stream
        const shouldStopTrack = !!this._constraints;

        this._isTogglingCameraEnabled = true;

        try {
            if (this._cameraEnabled) {
                if (track) {
                    // We have existing video track, just enable it
                    track.enabled = true;
                } else {
                    // We dont have video track, get new one
                    const newStream = await navigator.mediaDevices.getUserMedia({
                        video: this._currentCameraDeviceId
                            ? { deviceId: { exact: this._currentCameraDeviceId } }
                            : true,
                    });

                    track = newStream.getVideoTracks()[0];
                    if (track) {
                        this.stream.addTrack(track);
                    }
                }
            } else {
                if (!track) {
                    return;
                }

                track.enabled = false;

                if (shouldStopTrack) {
                    track.stop();
                    this.stream.removeTrack(track);
                }
            }

            // Dispatch event on stream to allow RTC layer effects
            this.stream.dispatchEvent(
                new CustomEvent("stopresumevideo", { detail: { track, enable: this._cameraEnabled } })
            );
        } catch (error) {
            // TODO: Update error state
        }

        this._isTogglingCameraEnabled = false;
    }

    toggleMichrophoneEnabled(enabled?: boolean) {
        const audioTrack = this.stream.getAudioTracks()[0];
        if (!audioTrack) {
            return;
        }

        // Update internal state and dispatch event early
        this._microphoneEnabled = enabled ?? !audioTrack.enabled;
        this.dispatchEvent(new CustomEvent("microphone_enabled", { detail: { enabled: this._microphoneEnabled } }));

        audioTrack.enabled = this._microphoneEnabled;
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
        this._currentCameraDeviceId = deviceId;
        const newStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } });
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
        this._currentMicrophoneDeviceId = deviceId;
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
        if (this._constraints) {
            const newStream = await navigator.mediaDevices.getUserMedia(this._constraints);

            const cameraTrack = newStream.getVideoTracks()[0];
            if (cameraTrack) {
                this._cameraEnabled = cameraTrack.enabled;
                this._currentCameraDeviceId = cameraTrack.getSettings().deviceId;
                this.stream.addTrack(cameraTrack);
            }

            const microphoneTrack = newStream.getAudioTracks()[0];
            if (microphoneTrack) {
                this._microphoneEnabled = microphoneTrack.enabled;
                this._currentMicrophoneDeviceId = microphoneTrack.getSettings().deviceId;
                this.stream.addTrack(microphoneTrack);
            }
        }

        this._updateDeviceList();

        this.dispatchEvent(
            new CustomEvent("stream_updated", {
                detail: { stream: this.stream },
            })
        );
        return this.stream;
    }

    stop() {
        if (this._constraints) {
            this.stream?.getTracks().forEach((t) => {
                t.stop();
            });
        }
    }
}
