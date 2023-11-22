import assert from "assert";

import { PureComponent } from "react";

class AudioElement extends PureComponent<{
    stream: MediaStream;
    featureVolumeMuteOn: boolean;
    muted: boolean;
    volume?: number;
    className?: string;
}> {
    _audioElement?: HTMLAudioElement;
    _wrapper: HTMLElement | null = null;
    componentDidMount() {
        this._createAudioElement();

        if (this.props.stream) {
            this._attachStream(this.props.stream);
        }
    }

    componentDidUpdate() {
        if (!this._audioElement) {
            return;
        }
        const newStream = this.props.stream;
        const volume = this.props.volume || 1;

        if (this.props.featureVolumeMuteOn && this._audioElement) {
            this._audioElement.volume = this.props.muted ? 0.0001 : volume;
        } else {
            this._audioElement.muted = Boolean(this.props.muted);
            this._audioElement.volume = volume;
        }

        if (newStream !== undefined && newStream !== this._audioElement.srcObject) {
            this._attachStream(newStream);
        }
    }

    componentWillUnmount() {
        delete this._audioElement;
    }

    _createAudioElement() {
        const audioElement = document.createElement("audio");
        const volume = this.props.volume || 1;
        audioElement.className = this.props.className;

        if (this.props.featureVolumeMuteOn) {
            audioElement.volume = this.props.muted ? 0.0001 : volume;
        } else {
            audioElement.muted = Boolean(this.props.muted);
            audioElement.volume = volume;
        }

        audioElement.setAttribute("autoplay", "true");

        this._audioElement = audioElement;
        this._attachAudioElement();
    }

    _attachAudioElement() {
        if (this._wrapper && this._audioElement) {
            this._wrapper.appendChild(this._audioElement);
        }
    }

    _attachStream(stream: MediaStream) {
        assert(this._audioElement, "no audio element registered");
        assert(stream !== undefined, "stream is required");
        this._audioElement.srcObject = stream;
    }

    refWrapper = (wrapper: HTMLElement | null) => {
        this._wrapper = wrapper;
        this._attachAudioElement();
    };

    async play() {
        await this._audioElement?.play();
    }

    setSinkId(speakerId: string) {
        if (speakerId && this._audioElement?.setSinkId && this._audioElement?.srcObject?.getAudioTracks()) {
            const p = this._audioElement.setSinkId(speakerId);
            if (p) p.catch((e: Error) => void console.error(`Unable to set sink to ${speakerId}`, e));
        }
    }

    render() {
        return <div ref={this.refWrapper} />;
    }
}

export default AudioElement;
