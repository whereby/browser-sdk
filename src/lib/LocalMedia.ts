import RtcManager from "@whereby/jslib-media/src/webrtc/RtcManager";
import type { GetConstraintsOptions } from "@whereby/jslib-media/src/webrtc/mediaConstraints";
import { getStream } from "@whereby/jslib-media/src/webrtc/MediaDevices";

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
type StopResumeVideoEvent = {
    track: MediaStreamTrack;
    enable: boolean;
};

interface LocalMediaEventsMap {
    camera_enabled: CustomEvent<CameraEnabledEvent>;
    device_list_updated: CustomEvent<DeviceListUpdatedEvent>;
    device_list_update_error: CustomEvent<DeviceListUpdateErrorEvent>;
    microphone_enabled: CustomEvent<MicrophoneEnabledEvent>;
    stream_updated: CustomEvent<StreamUpdatedEvent>;
    stopresumevideo: CustomEvent<StopResumeVideoEvent>;
}
type LocalMediaEventKey = keyof LocalMediaEventsMap;
type LocalMediaEventType<T extends LocalMediaEventKey> = LocalMediaEventsMap[T];
type LocalMediaEventPayload<T extends LocalMediaEventKey> = LocalMediaEventType<T> extends CustomEvent<infer U>
    ? U
    : never;
class LocalMediaEvent<T extends LocalMediaEventKey> extends CustomEvent<LocalMediaEventPayload<T>> {
    constructor(eventType: T, eventInitDict?: CustomEventInit<LocalMediaEventPayload<T>>) {
        super(eventType, eventInitDict);
    }
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

export interface LocalMediaOptions {
    audio: boolean;
    video: boolean;
}
export default class LocalMedia extends TypedLocalMediaEventTarget {
    private _options: LocalMediaOptions | null = null;
    public _rtcManagers: RtcManager[];

    private _devices: MediaDeviceInfo[] = [];
    public stream: MediaStream;
    public screenshareStream?: MediaStream;

    // Camera state
    private _cameraEnabled: boolean;
    private _currentCameraDeviceId: string | undefined;
    private _isTogglingCameraEnabled = false;

    // Mircophone state
    private _microphoneEnabled: boolean;
    private _currentMicrophoneDeviceId: string | undefined;

    constructor(optionsOrStream: LocalMediaOptions | MediaStream) {
        super();

        if (optionsOrStream instanceof MediaStream) {
            this.stream = optionsOrStream;
        } else {
            this._options = optionsOrStream;
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
        this.dispatchEvent(new LocalMediaEvent("camera_enabled", { detail: { enabled: this._cameraEnabled } }));

        // Only stop tracks if we fully own the media stream
        const shouldStopTrack = !!this._options;

        this._isTogglingCameraEnabled = true;

        try {
            if (this._cameraEnabled) {
                if (track) {
                    // We have existing video track, just enable it
                    track.enabled = true;
                } else {
                    // We dont have video track, get new one
                    await getStream(
                        {
                            ...this._getConstraintsOptions(),
                            audioId: false,
                            videoId: this._currentCameraDeviceId,
                            type: "exact",
                        },
                        { replaceStream: this.stream }
                    );

                    track = this.stream.getVideoTracks()[0];
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
                new LocalMediaEvent("stopresumevideo", { detail: { track, enable: this._cameraEnabled } })
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
        this.dispatchEvent(new LocalMediaEvent("microphone_enabled", { detail: { enabled: this._microphoneEnabled } }));

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

    private _getConstraintsOptions(): GetConstraintsOptions {
        return {
            devices: this._devices,
            options: {
                disableAEC: false,
                disableAGC: false,
                hd: true,
                lax: false,
                lowDataMode: false,
                simulcast: true,
                widescreen: true,
            },
        };
    }

    private async _setDevice({ audioId, videoId }: { audioId?: boolean | string; videoId?: boolean | string }) {
        const { replacedTracks } = await getStream(
            {
                ...this._getConstraintsOptions(),
                audioId,
                videoId,
                type: "exact",
            },
            { replaceStream: this.stream }
        );

        if (replacedTracks) {
            replacedTracks.forEach((oldTrack) => {
                const newTrack =
                    oldTrack.kind === "audio" ? this.stream.getAudioTracks()[0] : this.stream.getVideoTracks()[0];

                this._rtcManagers.forEach((rtcManager) => {
                    rtcManager.replaceTrack(oldTrack, newTrack);
                });
            });
        }

        this.dispatchEvent(
            new LocalMediaEvent("stream_updated", {
                detail: { stream: this.stream },
            })
        );
    }

    async setCameraDevice(deviceId: string) {
        this._currentCameraDeviceId = deviceId;
        await this._setDevice({ videoId: this._currentCameraDeviceId, audioId: false });
    }

    async setMicrophoneDevice(deviceId: string) {
        this._currentMicrophoneDeviceId = deviceId;
        await this._setDevice({ audioId: this._currentMicrophoneDeviceId, videoId: false });
    }

    private async _updateDeviceList() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.dispatchEvent(
                new LocalMediaEvent("device_list_updated", {
                    detail: {
                        cameraDevices: devices.filter((d) => d.kind === "videoinput"),
                        microphoneDevices: devices.filter((d) => d.kind === "audioinput"),
                        speakerDevices: devices.filter((d) => d.kind === "audiooutput"),
                    },
                })
            );
            this._devices = devices;
        } catch (error) {
            this.dispatchEvent(
                new LocalMediaEvent("device_list_update_error", {
                    detail: {
                        error,
                    },
                })
            );
            throw error;
        }
    }

    async start() {
        await this._updateDeviceList();

        if (this._options) {
            await getStream(
                {
                    ...this._getConstraintsOptions(),
                    audioId: this._options.audio,
                    videoId: this._options.video,
                },
                { replaceStream: this.stream }
            );

            const cameraTrack = this.stream.getVideoTracks()[0];
            if (cameraTrack) {
                this._cameraEnabled = cameraTrack.enabled;
                this._currentCameraDeviceId = cameraTrack.getSettings().deviceId;
            }

            const microphoneTrack = this.stream.getAudioTracks()[0];
            if (microphoneTrack) {
                this._microphoneEnabled = microphoneTrack.enabled;
                this._currentMicrophoneDeviceId = microphoneTrack.getSettings().deviceId;
            }
        }

        this.dispatchEvent(
            new LocalMediaEvent("stream_updated", {
                detail: { stream: this.stream },
            })
        );
        return this.stream;
    }

    stop() {
        if (this._options) {
            this.stream?.getTracks().forEach((t) => {
                t.stop();
            });
        }
    }
}
