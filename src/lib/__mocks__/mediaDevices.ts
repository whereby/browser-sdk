import MockMediaStream from "./MediaStream";

const mockMediaDevices = {
    addEventListener: jest.fn(),
    enumerateDevices: jest.fn().mockResolvedValue([]),
    getUserMedia: jest.fn().mockResolvedValue(new MockMediaStream()),
};

export default mockMediaDevices;
