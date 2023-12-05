export default class MockMediaStream implements MediaStream {
    private _tracks: MediaStreamTrack[];

    active = false;
    id = "";

    constructor(streamOrTracks?: MediaStreamTrack[] | MediaStream) {
        if (streamOrTracks instanceof Array<MediaStreamTrack>) {
            this._tracks = streamOrTracks;
        } else {
            this._tracks = [];
        }
    }

    onaddtrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => void) | null = null;
    onremovetrack: ((this: MediaStream, ev: MediaStreamTrackEvent) => void) | null = null;
    addTrack(track: MediaStreamTrack): void {
        this._tracks.push(track);
    }
    clone(): MediaStream {
        throw new Error("Method not implemented.");
    }
    getAudioTracks(): MediaStreamTrack[] {
        return this._tracks.filter((t) => t.kind === "audio");
    }
    getTrackById(trackId: string): MediaStreamTrack | null {
        throw new Error(`Method not implemented: ${trackId}`);
    }
    getTracks(): MediaStreamTrack[] {
        return this._tracks;
    }
    getVideoTracks(): MediaStreamTrack[] {
        return this._tracks.filter((t) => t.kind === "video");
    }
    removeTrack(track: MediaStreamTrack): void {
        this._tracks = this._tracks.filter((t) => t !== track);
    }
    addEventListener<K extends keyof MediaStreamEventMap>(
        type: K,
        listener: (this: MediaStream, ev: MediaStreamEventMap[K]) => void,
        options?: boolean | AddEventListenerOptions | undefined
    ): void;
    addEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | AddEventListenerOptions | undefined
    ): void;
    addEventListener(type: unknown, listener: unknown, options?: unknown): void {
        throw new Error(`Method not implemented. ${type}, ${listener}, ${options}`);
    }
    removeEventListener<K extends keyof MediaStreamEventMap>(
        type: K,
        listener: (this: MediaStream, ev: MediaStreamEventMap[K]) => void,
        options?: boolean | EventListenerOptions | undefined
    ): void;
    removeEventListener(
        type: string,
        listener: EventListenerOrEventListenerObject,
        options?: boolean | EventListenerOptions | undefined
    ): void;
    removeEventListener(type: unknown, listener: unknown, options?: unknown): void {
        throw new Error(`Method not implemented. ${type}, ${listener}, ${options}`);
    }
    dispatchEvent(event: Event): boolean {
        throw new Error(`Method not implemented. ${event}`);
    }
}
