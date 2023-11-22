import assert from "assert";

import adapter from "webrtc-adapter";

import { PureComponent } from "react";

import styles from "./styles.css";

class Video extends PureComponent<{
    stream: MediaStream;
    ariaHidden?: unknown;
    className?: string;
    clientId: string;
    onVideoLoaded: () => void;
    onVideoResized: () => void;
}> {
    _videoElement?: HTMLVideoElement | null = null;
    _wrapper: HTMLElement | null = null;
    componentDidMount() {
        this._createVideoElement();

        if (this.props.stream) {
            this._attachStream(this.props.stream);

            // do a delayed srcObject refresh to work around ios safari freeze bug
            // we should remove this as soon as it isn't needed anymore
            // confirmed needed in iOS 15.3
            if (adapter.browserDetails.browser === "safari" && window.ontouchstart) {
                setTimeout(() => {
                    // eslint-disable-next-line no-self-assign
                    if (this._videoElement) this._videoElement.srcObject = this._videoElement.srcObject;
                }, 1000);
            }
        }
    }

    componentDidUpdate() {
        const newStream = this.props.stream;
        if (newStream === undefined || newStream === this._videoElement?.srcObject) {
            return;
        }

        this._attachStream(newStream);
    }

    componentWillUnmount() {
        this._videoElement?.removeEventListener("loadedmetadata", this._handleLoadedMetadata);
        this._videoElement?.removeEventListener("resize", this._handleResize);
        delete this._videoElement;
    }

    _createVideoElement() {
        const video = document.createElement("video");
        const { ariaHidden, className } = this.props;

        if (className) {
            video.className = className;
        }

        // Android/Chrome webrtc bug fix
        const versionMatch = navigator.userAgent.match(/Chrom(e|ium)\/(\d+)./);
        if (
            (window as any).webkitRTCPeerConnection &&
            navigator.userAgent.match(/Android \d+./) &&
            versionMatch &&
            versionMatch[2] &&
            parseInt(versionMatch[2], 10) === 61
        ) {
            video.classList.add("VideoElement-bugfixChromeAndroid");
        }

        video.addEventListener("loadedmetadata", this._handleLoadedMetadata);
        video.addEventListener("resize", this._handleResize);
        video.addEventListener("pause", this._handlePause);
        video.id = this.props.clientId;

        video.muted = true;
        video.setAttribute("autoplay", "");
        // neccessary to make videos autoplay on iOS
        video.setAttribute("playsinline", "");
        if (ariaHidden) {
            video.setAttribute("aria-hidden", "true");
        }

        this._videoElement = video;
        this._attachVideoElement();
    }

    _attachVideoElement() {
        if (this._wrapper && this._videoElement) {
            this._wrapper.appendChild(this._videoElement);
        }
    }

    _attachStream(stream: MediaStream) {
        assert(this._videoElement, "no video element registered");
        assert(stream !== undefined, "stream is required");
        this._videoElement.srcObject = stream;
    }

    _handleLoadedMetadata = () => {
        this.props.onVideoLoaded && this.props.onVideoLoaded();
    };

    _handleResize = () => {
        // Chrome workaround: video element attached to a stream in a bad state
        // fires the resize event in an endless loop:
        if (!this._videoElement || !this._videoElement.videoHeight || !this._videoElement.videoWidth) {
            return;
        }
        this.props.onVideoResized && this.props.onVideoResized();
    };

    _handlePause = async () => {
        // some browsers pause the video if it gets re-mounted in a different
        // container - ignore pause events:
        await this._videoElement?.play();
    };

    refWrapper = (wrapper: HTMLElement | null) => {
        this._wrapper = wrapper;
        this._attachVideoElement();
    };

    async refreshStream() {
        if (!this._videoElement) {
            return;
        }
        // This gives us a new load event (and works around buggy browser
        // behaviours when switching streams)
        // eslint-disable-next-line no-self-assign
        this._videoElement.srcObject = this._videoElement.srcObject;

        if (adapter.browserDetails.browser === "safari") {
            await this._videoElement.play();
        }
    }

    captureAspectRatio() {
        if (this._videoElement) {
            const w = this._videoElement.videoWidth;
            const h = this._videoElement.videoHeight;
            // Hack: videos with empty streams sometimes have a width and height of 2 in Chrome
            // resulting in a square aspect ratio. Set a min video dim to 10px as workaround:
            if (w && h && w + h > 20) {
                return w / h;
            }
        }
        return null;
    }

    render() {
        return <div className={styles.VideoElement} ref={this.refWrapper} />;
    }
}

export default Video;
