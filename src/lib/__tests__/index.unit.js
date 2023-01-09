import { jest } from "@jest/globals";

const define = jest.fn();
const ref = jest.fn();
jest.mock("heresy", () => ({
    __esModule: true,
    define,
    ref,
}));

describe("@whereby/browser-sdk", () => {
    it("should export sdk version", async () => {
        const whereby = await import("../");
        expect(whereby.default.sdkVersion).toEqual(expect.any(String));
    });

    describe("web component", () => {
        it("should define <whereby-embed />", async () => {
            await import("../");
            expect(define).toBeCalledWith("WherebyEmbed", expect.any(Object));
        });

        it("should expose attributes", async () => {
            await import("..");
            expect(define).toBeCalledWith(
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
                        "audio",
                        "background",
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

            expect(define).toBeCalledWith(
                expect.any(String),
                expect.objectContaining({
                    startRecording: expect.any(Function),
                    stopRecording: expect.any(Function),
                    toggleCamera: expect.any(Function),
                    toggleMicrophone: expect.any(Function),
                    toggleScreenshare: expect.any(Function),
                })
            );
        });
    });
});
