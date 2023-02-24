import { jest } from "@jest/globals";

const MockMediaStreamTrack = jest.fn(function (this: MediaStreamTrack, kind = "audio"): MediaStreamTrack {
    Object.assign(this, { kind, stop: jest.fn() });
    return this;
});

export default MockMediaStreamTrack;
