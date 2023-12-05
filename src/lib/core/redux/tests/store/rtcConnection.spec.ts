import { createStore, mockRtcManager } from "../store.setup";
import { doHandleAcceptStreams, doConnectRtc, doDisconnectRtc } from "../../slices/rtcConnection";
import { randomRemoteParticipant, randomString } from "../../../../__mocks__/appMocks";

describe("actions", () => {
    it("doHandleAcceptStreams", async () => {
        mockRtcManager.acceptNewStream = jest.fn();
        const id1 = randomString("stream1");
        const id2 = randomString("stream2");
        const id3 = randomString("stream3");
        const participant1 = randomRemoteParticipant({ id: "p1", streams: [{ id: id1, state: "to_accept" }] });
        const participant2 = randomRemoteParticipant({
            id: "p2",
            streams: [
                { id: id2, state: "done_accept" },
                { id: id3, state: "to_accept" },
            ],
        });

        const store = createStore({
            withRtcManager: true,
            initialState: {
                remoteParticipants: { remoteParticipants: [participant1, participant2] },
            },
        });

        store.dispatch(
            doHandleAcceptStreams([
                { clientId: participant1.id, streamId: id1, state: "to_accept" },
                { clientId: participant2.id, streamId: id3, state: "to_accept" },
            ])
        );

        expect(JSON.stringify(mockRtcManager.acceptNewStream.mock.calls)).toStrictEqual(
            JSON.stringify([
                [{ streamId: id1, clientId: participant1.id, shouldAddLocalVideo: false, activeBreakout: false }],
                [{ streamId: id3, clientId: participant2.id, shouldAddLocalVideo: false, activeBreakout: false }],
            ])
        );
        expect(mockRtcManager.acceptNewStream).toHaveBeenCalledTimes(2);
    });

    it("doConnectRtc", async () => {
        const store = createStore();

        store.dispatch(doConnectRtc());

        expect(store.getState().rtcConnection.status).toBe("");
        expect(store.getState().rtcConnection.dispatcherCreated).toBe(false);
        expect(store.getState().rtcConnection.error).toBe(null);
    });

    it("doDisconnectRtc", async () => {
        const store = createStore();

        store.dispatch(doDisconnectRtc());

        expect(store.getState().rtcConnection.status).toBe("");
        expect(store.getState().rtcConnection.dispatcherCreated).toBe(false);
        expect(store.getState().rtcConnection.error).toBe(null);
    });
});
