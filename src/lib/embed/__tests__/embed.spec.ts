import { jest } from "@jest/globals";

const define = jest.fn();
const ref = jest.fn();
jest.mock("heresy", () => ({
    __esModule: true,
    define,
    ref,
}));

describe("@whereby/browser-sdk", () => {
    describe("web component", () => {
        it("should define <whereby-embed />", async () => {
            await import("../");
            expect(define).toHaveBeenCalledWith("WherebyEmbed", expect.any(Object));
        });

        it("should expose attributes", async () => {
            await import("../");
            expect(define).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    observedAttributes: [
                        "displayname",
                        "minimal",
                        "room",
                        "subdomain",
                        "lang",
                        "metadata",
                        "groups",
                        "virtualbackgroundurl",
                        "avatarurl",
                        "externalid",
                        "title",
                        "audio",
                        "background",
                        "cameraaccess",
                        "chat",
                        "people",
                        "embed",
                        "emptyroominvitation",
                        "help",
                        "leavebutton",
                        "precallreview",
                        "screenshare",
                        "video",
                        "floatself",
                        "recording",
                        "logo",
                        "locking",
                        "participantcount",
                        "settingsbutton",
                        "pipbutton",
                        "morebutton",
                        "personality",
                        "subgridlabels",
                        "lowdata",
                        "breakout",
                    ],
                })
            );
        });

        it("should expose commands", async () => {
            await import("../");

            expect(define).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    startRecording: expect.any(Function),
                    stopRecording: expect.any(Function),
                    toggleCamera: expect.any(Function),
                    toggleMicrophone: expect.any(Function),
                    toggleScreenshare: expect.any(Function),
                    toggleChat: expect.any(Function),
                })
            );
        });
    });
});
