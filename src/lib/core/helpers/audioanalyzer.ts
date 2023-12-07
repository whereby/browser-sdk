/**
 * AudioAnalyzer to be used in Audio Graph
 * in order to subscribe frequency data changes
 *
 * @typedef {object} AudioAnalyzer
 * @property {AnalyserNode} analyzer - AnalyserNode to connect with other AudioNode
 * @property {Function} subscribeFrequencyData - Subscribe to byte frequency data changes from AnalyserNode.
 * @property {Function} destroy - Unsubscribe data changes and disconnect AnalyserNode from audio-processing graph.
 */

/**
 * Create AudioAnalyzer object to be used in audio-processing graph
 * MDN doc: https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
 *
 * @export
 * @param {AudioContext} ctx
 * @returns {AudioAnalyzer}
 */
import adapter from "webrtc-adapter";

export function createAnalyzer(ctx: AudioContext, fftSize = 256) {
    let timeoutId: ReturnType<typeof setTimeout> | undefined; // scheduled setTimeout id
    let unsubscribed = false;
    const analyzer = ctx.createAnalyser();
    analyzer.fftSize = fftSize; // size of FFT (Fast Fourier Transform)
    analyzer.smoothingTimeConstant = 0.65; // the averaging constant with the last analysis frame

    return {
        analyzer,
        subscribeFrequencyData: (onData: (data: Uint8Array) => void, frequency = 30) => {
            unsubscribed = false;
            // Allocate Uint8Array size as FFT size
            const dataArray = new Uint8Array(analyzer.frequencyBinCount);
            const watch = () => {
                if (!unsubscribed) {
                    // Get current frequency data in byte
                    analyzer.getByteFrequencyData(dataArray);

                    // Pass data to onData callback
                    onData(dataArray);

                    // Schedule next watch
                    timeoutId = setTimeout(watch, 1000 / frequency);
                }
            };
            timeoutId = setTimeout(watch, 1000 / frequency);
        },
        destroy: () => {
            unsubscribed = true;
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
                timeoutId = undefined;
            }
            analyzer.disconnect(); // Disconnect AnalyserNode from audio-processing graph
        },
    };
}

/**
 * Create necessary AudioNodes with AudioContext
 * in order to subscribe frequency data changes from MediaStream
 *
 * Audio processing graph used in StreamAudioAnalyzer:
 *
 * ( created from MediaStream )
 *  MediaStreamAudioSourceNode --> AnalyserNode
 *
 * @export
 * @class StreamAudioAnalyzer
 *
 * @property {MediaStream} _stream - Stream obtained using the WebRTC or Media Capture and Streams APIs
 * @property {AudioContext} _audioCtx - Context to build audio-processing graph with
 * @property {MediaStreamAudioSourceNode} _source - AudioNode made from MediaStream to be used in audio-processing graph
 * @property {AudioAnalyzer} _audioAnalyzer - createAnalyzer() returned object, property analyzer as AnalyserNode
 */
export class StreamAudioAnalyzer {
    _audioCtx?: AudioContext;
    _ownsAudioCtx?: boolean;
    _clonedStream: boolean;
    _stream?: MediaStream;
    _source?: MediaStreamAudioSourceNode;
    _audioAnalyzer?: ReturnType<typeof createAnalyzer>;
    /**
     * Creates an instance of StreamAudioAnalyzer.
     *
     * @constructor
     * @param {MediaStream} stream - Stream obtained using the WebRTC or Media Capture and Streams APIs
     * @param {AudioContext} audioContext - Context to build audio-processing graph with
     * @memberof StreamAudioAnalyzer
     */
    constructor(stream: MediaStream, fftSize = 256, audioContext: AudioContext) {
        const { AudioContext, webkitAudioContext } = global as any;
        this._audioCtx = audioContext ? audioContext : new (AudioContext || webkitAudioContext)();
        this._ownsAudioCtx = audioContext ? false : true;
        this._clonedStream = false;
        this._stream = stream;

        if (adapter.browserDetails.browser === "safari") {
            // Clone stream to work around Safari streamSource bug:
            // https://github.com/ai/audio-recorder-polyfill/issues/17
            // https://stackoverflow.com/questions/58564669/audionode-disconnect-followed-by-connect-not-working-in-safari
            this._clonedStream = true;
            this._stream = new MediaStream(stream.getAudioTracks().map((audioTrack) => audioTrack.clone()));
            // Un-mute any audio tracks in case they were muted when we cloned them:
            this._stream.getAudioTracks().forEach((t) => (t.enabled = true));
        }
        this._source = this._audioCtx?.createMediaStreamSource(this._stream);
        if (this._audioCtx && this._source) {
            this._audioAnalyzer = createAnalyzer(this._audioCtx, fftSize);
            this._source.connect(this._audioAnalyzer.analyzer);
        }
    }

    /**
     * Clear current using AudioNodes in audio-processing graph
     * and close current AudioContext
     *
     *
     * @memberof StreamAudioAnalyzer
     */
    _clearAudioResources() {
        this._audioAnalyzer?.destroy();
        this._audioAnalyzer = undefined;
        this._source?.disconnect();
        this._source = undefined;
        // We cloned the original stream so we must clean up and stop all tracks:
        if (this._clonedStream) this._stream?.getTracks()?.forEach((t) => t.stop());
        // Only close the context if we own it:
        this._stream = undefined;
        if (this._ownsAudioCtx) {
            this._audioCtx?.close();
        }
        this._audioCtx = undefined;
    }

    /**
     * Subscribe to current MediaStream frequency data changes
     *
     * @param {Function} onData - callback when frequency data changes
     * @returns {clearAudioResourcesCallback} - clear related Audio Nodes callback
     * @memberof StreamAudioAnalyzer
     */
    subscribeData(onData: (data: Uint8Array) => void) {
        this._audioAnalyzer?.subscribeFrequencyData(onData);

        return () => this._clearAudioResources();
    }
}

export class AudioSourceAnalyzer {
    _audioCtx?: AudioContext;
    _ownsAudioCtx?: boolean;
    _stream?: MediaStream;
    _source?: MediaStreamAudioSourceNode;
    _audioAnalyzer?: ReturnType<typeof createAnalyzer>;
    constructor(source: MediaStreamAudioSourceNode, fftSize = 256, audioContext: AudioContext) {
        const { AudioContext, webkitAudioContext } = global as any;
        this._audioCtx = audioContext ? audioContext : new (AudioContext || webkitAudioContext)();
        this._ownsAudioCtx = audioContext ? false : true;
        this._source = source;

        if (this._audioCtx) {
            this._audioAnalyzer = createAnalyzer(this._audioCtx, fftSize);
            this._source.connect(this._audioAnalyzer.analyzer);
        }
    }

    _clearAudioResources() {
        this._audioAnalyzer?.destroy();
        this._audioAnalyzer = undefined;
        this._source?.disconnect();
        this._source = undefined;
        this._audioCtx = undefined;
    }

    subscribeData(onData: (data: Uint8Array) => void) {
        this._audioAnalyzer?.subscribeFrequencyData(onData);

        return () => this._clearAudioResources();
    }
}
