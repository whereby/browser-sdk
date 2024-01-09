import MockMediaStream from "./MediaStream";

const devices = [
    {
        deviceId: "audioDeviceId",
        kind: "audioinput",
        groupId: "a",
        label: "Microphone",
    },
    {
        deviceId: "videoDeviceId",
        kind: "videoinput",
        groupId: "b",
        label: "Camera",
    },
];

const mockMediaDevices = {
    addEventListener: jest.fn(),
    enumerateDevices: jest.fn().mockResolvedValue(devices),
    getUserMedia: jest.fn().mockResolvedValue(new MockMediaStream()),
};

export default mockMediaDevices;
