import {
    selectShouldConnectRtc,
    selectShouldInitializeRtc,
    selectShouldDisconnectRtc,
    selectStreamsToAccept,
} from "../rtcConnection";
import { oneOf, randomRemoteParticipant } from "../../../../../lib/__mocks__/appMocks";
import { StreamState } from "../../../../../lib/core/RoomParticipant";

describe("rtcConnectionSlice", () => {
    describe("reactors", () => {
        describe("selectShouldConnectRtc", () => {
            const x = () => oneOf(true, false);

            it.each`
                dispatcherCreated | isCreatingDispatcher | signalSocket | expected
                ${true}           | ${x()}               | ${{}}        | ${false}
                ${x()}            | ${true}              | ${{}}        | ${false}
                ${x()}            | ${x()}               | ${undefined} | ${false}
                ${false}          | ${false}             | ${{}}        | ${true}
            `(
                "should return $expected when rtcDispatcherCreated=$rtcDispatcherCreated, rtcIsCreatingDispatcher=$rtcIsCreatingDispatcher, signalSocket=$signalSocket",
                ({ dispatcherCreated, isCreatingDispatcher, signalSocket, expected }) => {
                    expect(
                        selectShouldConnectRtc.resultFunc(dispatcherCreated, isCreatingDispatcher, signalSocket)
                    ).toEqual(expected);
                }
            );
        });

        describe("selectShouldInitializeRtc", () => {
            const x = () => oneOf(true, false);

            it.each`
                rtcManager   | rtcManagerInitialized | localMediaStatus | expected
                ${undefined} | ${x()}                | ${"started"}     | ${false}
                ${{}}        | ${true}               | ${"started"}     | ${false}
                ${{}}        | ${false}              | ${"started"}     | ${true}
                ${{}}        | ${x()}                | ${"starting"}    | ${false}
            `(
                "should return $expected when rtcManager=$rtcManager, rtcManagerInitialized=$rtcManagerInitialized, localMediaStatus=$localMediaStatus",
                ({ rtcManager, rtcManagerInitialized, localMediaStatus, expected }) => {
                    expect(
                        selectShouldInitializeRtc.resultFunc(rtcManager, rtcManagerInitialized, localMediaStatus)
                    ).toEqual(expected);
                }
            );
        });

        describe("selectShouldDisconnectRtc", () => {
            const x = () => oneOf(true, false);

            it.each`
                rtcStatus         | wantsToJoin | expected
                ${"ready"}        | ${true}     | ${false}
                ${"ready"}        | ${false}    | ${true}
                ${""}             | ${x()}      | ${false}
                ${"disconnected"} | ${x()}      | ${false}
            `(
                "should return $expected when rtcStatus=$rtcStatus, wantsToJoin=$wantsToJoin",
                ({ rtcStatus, wantsToJoin, expected }) => {
                    expect(selectShouldDisconnectRtc.resultFunc(rtcStatus, wantsToJoin)).toEqual(expected);
                }
            );
        });

        describe("selectStreamsToAccept", () => {
            const x = () => oneOf<{ id: number } | "x" | null | undefined>({ id: 1 }, "x", null, undefined);
            const c = (id: string, streamStates: StreamState[]) =>
                randomRemoteParticipant({
                    id,
                    streams: streamStates.map((s, i) => ({ id: `${i}`, state: s })),
                });

            it.each`
                rtcStatus  | remoteParticipants                                      | expected
                ${""}      | ${[x(), x()]}                                           | ${[]}
                ${"ready"} | ${[c("id0", ["to_accept"])]}                            | ${[{ clientId: "id0", streamId: "0", state: "to_accept" }]}
                ${""}      | ${[c("id1", ["to_accept"])]}                            | ${[]}
                ${"ready"} | ${[c("id2", ["to_unaccept"])]}                          | ${[{ clientId: "id2", streamId: "0", state: "to_accept" }]}
                ${"ready"} | ${[c("id3", ["done_accept"])]}                          | ${[]}
                ${"ready"} | ${[c("id4", ["to_accept", "done_accept"])]}             | ${[{ clientId: "id4", streamId: "0", state: "to_accept" }]}
                ${"ready"} | ${[c("id5", ["to_accept"]), c("id6", ["done_accept"])]} | ${[{ clientId: "id5", streamId: "0", state: "to_accept" }]}
                ${"ready"} | ${[c("id7", ["to_accept", "to_accept"])]}               | ${[{ clientId: "id7", streamId: "0", state: "to_accept" }, { clientId: "id7", streamId: "1", state: "to_accept" }]}
            `(
                "should return $expected when rtcStatus=$rtcStatus, remoteParticipants=$remoteParticipants",
                ({ rtcStatus, remoteParticipants, expected }) => {
                    expect(selectStreamsToAccept.resultFunc(rtcStatus, remoteParticipants)).toEqual(expected);
                }
            );
        });
    });
});
