import LocalMedia from "../LocalMedia";
import MockMediaStream from "./MediaStream";

export default jest.fn(function (this: LocalMedia) {
    this.addEventListener = jest.fn();
    this.getCameraDeviceId = jest.fn();
    this.getMicrophoneDeviceId = jest.fn();
    this.setCameraDevice = jest.fn();
    this.setMicrophoneDevice = jest.fn();
    this.startScreenshare = jest.fn().mockResolvedValue(new MockMediaStream());
    this.stopScreenshare = jest.fn().mockResolvedValue(true);
    this.start = jest.fn();
    this.stop = jest.fn();
});
