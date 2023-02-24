import LocalMedia from "../LocalMedia";

export default jest.fn(function (this: LocalMedia) {
    this.addEventListener = jest.fn();
    this.getCameraDeviceId = jest.fn();
    this.getMicrophoneDeviceId = jest.fn();
    this.setCameraDevice = jest.fn();
    this.setMicrophoneDevice = jest.fn();
    this.start = jest.fn();
    this.stop = jest.fn();
});
