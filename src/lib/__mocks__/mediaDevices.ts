const mockMediaDevices = {
    addEventListener: jest.fn(),
    enumerateDevices: jest.fn().mockResolvedValue([]),
    getUserMedia: jest.fn(),
};

export default mockMediaDevices;
