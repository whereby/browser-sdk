import { jest } from "@jest/globals";

const MockMediaStreamTrack = jest.fn(function (this: MediaStreamTrack, kind = "audio"): MediaStreamTrack {
    Object.assign(this, {
        enabled: true,
        kind,
        stop: jest.fn(),
        getSettings: jest.fn(() => ({
            deviceId: "<device_id>",
        })),
    });
    return this;
});

export default MockMediaStreamTrack;
