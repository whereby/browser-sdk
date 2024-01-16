import { remoteParticipantsSlice, selectScreenshares } from "../remoteParticipants";
import { signalEvents } from "../signalConnection/actions";
import { rtcEvents } from "../rtcConnection/actions";
import {
    randomSignalClient,
    randomRemoteParticipant,
    randomString,
    randomMediaStream,
} from "../../../../__mocks__/appMocks";

describe("remoteParticipantsSlice", () => {
    describe("reducers", () => {
        describe("signalEvents.roomJoined", () => {
            it("should update state", () => {
                const result = remoteParticipantsSlice.reducer(
                    undefined,
                    signalEvents.roomJoined({
                        isLocked: false,
                        selfId: "selfId",
                        room: {
                            clients: [
                                {
                                    displayName: "displayName",
                                    id: "id",
                                    streams: [],
                                    isAudioEnabled: true,
                                    isVideoEnabled: true,
                                    role: {
                                        roleName: "participant",
                                    },
                                    startedCloudRecordingAt: null,
                                },
                            ],
                            knockers: [],
                            session: null,
                        },
                    })
                );

                expect(result.remoteParticipants).toEqual([
                    {
                        displayName: "displayName",
                        id: "id",
                        streams: [],
                        isAudioEnabled: true,
                        isVideoEnabled: true,
                        isLocalParticipant: false,
                        stream: null,
                        newJoiner: false,
                        role: {
                            roleName: "participant",
                        },
                        startedCloudRecordingAt: null,
                        presentationStream: null,
                    },
                ]);
            });
        });

        it("signalEvents.newClient", () => {
            const client = randomSignalClient();

            const result = remoteParticipantsSlice.reducer(
                undefined,
                signalEvents.newClient({
                    client,
                })
            );

            expect(result.remoteParticipants).toEqual([
                {
                    id: client.id,
                    displayName: client.displayName,
                    isAudioEnabled: client.isAudioEnabled,
                    isVideoEnabled: client.isVideoEnabled,
                    isLocalParticipant: false,
                    stream: null,
                    streams: [],
                    newJoiner: true,
                    role: client.role,
                    startedCloudRecordingAt: client.startedCloudRecordingAt,
                    presentationStream: null,
                },
            ]);
        });

        it("signalEvents.clientLeft", () => {
            const participant = randomRemoteParticipant();
            const state = {
                remoteParticipants: [participant],
            };

            const result = remoteParticipantsSlice.reducer(
                state,
                signalEvents.clientLeft({
                    clientId: participant.id,
                })
            );

            expect(result.remoteParticipants).toEqual([]);
        });

        describe("signalEvents.audioEnabled", () => {
            it("should update the participant", () => {
                const isAudioEnabled = true;
                const participant = randomRemoteParticipant();
                const state = {
                    remoteParticipants: [participant],
                };

                const result = remoteParticipantsSlice.reducer(
                    state,
                    signalEvents.audioEnabled({
                        clientId: participant.id,
                        isAudioEnabled,
                    })
                );

                expect(result.remoteParticipants).toEqual([
                    {
                        ...participant,
                        isAudioEnabled,
                    },
                ]);
            });
        });

        describe("signalEvents.clientMetadataReceived", () => {
            it("should update the participant when type is UserData", () => {
                const displayName = randomString();
                const participant = randomRemoteParticipant();
                const state = {
                    remoteParticipants: [participant],
                };

                const result = remoteParticipantsSlice.reducer(
                    state,
                    signalEvents.clientMetadataReceived({
                        type: "UserData",
                        payload: {
                            clientId: participant.id,
                            displayName,
                        },
                    })
                );

                expect(result.remoteParticipants).toEqual([
                    {
                        ...participant,
                        displayName,
                    },
                ]);
            });
        });

        describe("signalEvents.videoEnabled", () => {
            it("should update the participant", () => {
                const isVideoEnabled = true;
                const participant = randomRemoteParticipant();
                const state = {
                    remoteParticipants: [participant],
                };

                const result = remoteParticipantsSlice.reducer(
                    state,
                    signalEvents.videoEnabled({
                        clientId: participant.id,
                        isVideoEnabled,
                    })
                );

                expect(result.remoteParticipants).toEqual([
                    {
                        ...participant,
                        isVideoEnabled,
                    },
                ]);
            });
        });

        describe("signalEvents.screenshareStarted", () => {
            it("should update the participant", () => {
                const participant = randomRemoteParticipant();
                const state = {
                    remoteParticipants: [participant],
                };

                const result = remoteParticipantsSlice.reducer(
                    state,
                    signalEvents.screenshareStarted({
                        clientId: participant.id,
                        streamId: "streamId",
                        hasAudioTrack: true,
                    })
                );

                expect(result.remoteParticipants).toEqual([
                    {
                        ...participant,
                        presentationStream: null,
                        streams: [
                            {
                                id: "streamId",
                                state: "to_accept",
                            },
                        ],
                    },
                ]);
            });
        });

        describe("signalEvents.screenshareStopped", () => {
            it("should update the participant", () => {
                const participant = randomRemoteParticipant({ streams: [{ id: "streamId", state: "to_accept" }] });
                const state = {
                    remoteParticipants: [participant],
                };

                const result = remoteParticipantsSlice.reducer(
                    state,
                    signalEvents.screenshareStopped({
                        clientId: participant.id,
                        streamId: "streamId",
                    })
                );

                expect(result.remoteParticipants).toEqual([
                    {
                        ...participant,
                        presentationStream: null,
                        streams: [],
                    },
                ]);
            });
        });

        describe("rtcEvents.streamAdded", () => {
            it("should update the participant", () => {
                const participant = randomRemoteParticipant();
                const stream = randomMediaStream();
                const state = {
                    remoteParticipants: [participant],
                };

                const result = remoteParticipantsSlice.reducer(
                    state,
                    rtcEvents.streamAdded({
                        clientId: participant.id,
                        streamId: "streamId",
                        stream,
                        streamType: "webcam",
                    })
                );

                expect(result.remoteParticipants).toEqual([
                    {
                        ...participant,
                        stream,
                    },
                ]);
            });
        });
    });

    describe("selectors", () => {
        const client1 = randomRemoteParticipant();
        const client2 = randomRemoteParticipant({
            presentationStream: randomMediaStream(),
        });
        const client3 = randomRemoteParticipant({
            presentationStream: randomMediaStream(),
        });

        describe("selectScreenshares", () => {
            const localScreenshareStream = randomMediaStream();

            it.each`
                localScreenshareStream    | remoteParticipants    | expected
                ${null}                   | ${[]}                 | ${[]}
                ${null}                   | ${[client1, client2]} | ${[{ id: "", hasAudioTrack: false, isLocal: false, participantId: client2.id, stream: client2.presentationStream }]}
                ${localScreenshareStream} | ${[]}                 | ${[{ id: "", hasAudioTrack: false, isLocal: true, participantId: "local", stream: localScreenshareStream }]}
                ${localScreenshareStream} | ${[client3]}          | ${[{ id: "", hasAudioTrack: false, isLocal: true, participantId: "local", stream: localScreenshareStream }, { id: "", hasAudioTrack: false, isLocal: false, participantId: client3.id, stream: client3.presentationStream }]}
            `(
                "should return $expected when localScreenshareStream=$localScreenshareStream, remoteParticipants=$remoteParticipants",
                ({ localScreenshareStream, remoteParticipants, expected }) => {
                    expect(selectScreenshares.resultFunc(localScreenshareStream, remoteParticipants)).toEqual(expected);
                }
            );
        });
    });
});
