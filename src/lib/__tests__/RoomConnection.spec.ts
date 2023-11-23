import { jest } from "@jest/globals";

import RoomConnection from "../../lib/core/RoomConnection";
import { RemoteParticipant } from "../RoomParticipant";
import MockMediaStream from "../__mocks__/MediaStream";

jest.mock("@whereby/jslib-media/src/utils/ServerSocket", () => {
    return jest.fn().mockImplementation(() => {
        return {
            on: jest.fn(),
            getManager: () => {
                return {
                    on: jest.fn(),
                };
            },
        };
    });
});
jest.mock("../LocalMedia");

describe("RoomConnection", () => {
    describe("constructor", () => {
        it("should set room key when part of url", () => {
            const roomKey = "abc";

            const roomConnection = new RoomConnection(`https://subdomain.whereby.com/<some-room>?roomKey=${roomKey}`, {
                localMediaOptions: { audio: true, video: true },
            });

            expect(roomConnection.roomKey).toEqual(roomKey);
        });

        it("should prefer room key passed directly in options", () => {
            const roomKey = "abc";

            const roomConnection = new RoomConnection(`https://subdomain.whereby.com/<some-room>?roomKey=urlKey`, {
                localMediaOptions: { audio: true, video: true },
                roomKey,
            });

            expect(roomConnection.roomKey).toEqual(roomKey);
        });
    });
});

describe("handleStreamAdded", () => {
    // let remoteParticipants: RemoteParticipant[];
    // beforeEach(() => {
    //     remoteParticipants = [
    //         new RemoteParticipant({
    //             displayName: "Participant",
    //             id: "id",
    //             newJoiner: false,
    //             streams: ["0", "screenshare"],
    //             isAudioEnabled: true,
    //             isVideoEnabled: true,
    //         }),
    //     ];
    // });
    // it("should return undefined if remote participant cannot be found", () => {
    //     const res = handleStreamAdded(remoteParticipants, {
    //         clientId: "zzz",
    //         stream: new MockMediaStream(),
    //         streamId: undefined,
    //         streamType: undefined,
    //     });
    //     expect(res).toEqual(undefined);
    // });
    // it("should return `participant_stream_added` when stream id cannot be matched", () => {
    //     const clientId = "id";
    //     const stream = new MockMediaStream();
    //     const streamId = undefined;
    //     const res = handleStreamAdded(remoteParticipants, {
    //         clientId,
    //         stream,
    //         streamId,
    //         streamType: undefined,
    //     });
    //     expect(res?.type).toEqual("participant_stream_added");
    //     expect(res?.detail).toEqual({ participantId: clientId, stream, streamId: stream.id });
    // });
    // it("should return `screenshare_started` when stream id is matched", () => {
    //     const clientId = "id";
    //     const stream = new MockMediaStream();
    //     const streamId = "screenshare";
    //     const res = handleStreamAdded(remoteParticipants, {
    //         clientId,
    //         stream,
    //         streamId,
    //         streamType: undefined,
    //     });
    //     expect(res?.type).toEqual("screenshare_started");
    //     expect(res?.detail).toEqual({
    //         participantId: clientId,
    //         stream,
    //         id: streamId,
    //         isLocal: false,
    //         hasAudioTrack: false,
    //     });
    // });
});
