import { createStore, mockRtcManager } from "../store.setup";
import {
    doHandleAcceptStreams,
    doConnectRtc,
    doDisconnectRtc,
    doRtcReportStreamResolution,
    doRtcManagerCreated,
    doRtcManagerInitialize,
} from "../../slices/rtcConnection";
import { randomRemoteParticipant, randomString } from "../../../../__mocks__/appMocks";
import MockMediaStream from "../../../../../lib/__mocks__/MediaStream";
import RtcManagerDispatcher from "@whereby/jslib-media/src/webrtc/RtcManagerDispatcher";
import { initialState as localMediaInitialState } from "../../slices/localMedia";

jest.mock("@whereby/jslib-media/src/webrtc/RtcManagerDispatcher");

describe("actions", () => {
    it("doHandleAcceptStreams", () => {
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

    it("doConnectRtc", () => {
        const store = createStore();

        store.dispatch(doConnectRtc());

        expect(RtcManagerDispatcher).toHaveBeenCalledTimes(1);
        expect(store.getState().rtcConnection.dispatcherCreated).toBe(true);
        expect(store.getState().rtcConnection.error).toBe(null);
    });

    it("doDisconnectRtc", () => {
        const store = createStore({ withRtcManager: true });

        store.dispatch(doDisconnectRtc());

        expect(mockRtcManager.disconnectAll).toHaveBeenCalledTimes(1);
        expect(store.getState().rtcConnection.dispatcherCreated).toBe(false);
        expect(store.getState().rtcConnection.rtcManager).toBe(null);
        expect(store.getState().rtcConnection.error).toBe(null);
    });

    it("doRtcReportStreamResolution", () => {
        const store = createStore({ withRtcManager: true });
        const streamId = randomString("streamId");
        const resolution = { width: 100, height: 100 };

        store.dispatch(doRtcReportStreamResolution({ streamId, ...resolution }));

        expect(mockRtcManager.updateStreamResolution).toHaveBeenCalledTimes(1);
        expect(mockRtcManager.updateStreamResolution).toHaveBeenCalledWith(streamId, null, resolution);
        expect(store.getState().rtcConnection.reportedStreamResolutions[streamId]).toStrictEqual(resolution);
    });

    it("doRtcManagerCreated", () => {
        const store = createStore({ withRtcManager: true });

        store.dispatch(doRtcManagerCreated({ rtcManager: mockRtcManager }));

        expect(store.getState().rtcConnection.rtcManager).toBe(mockRtcManager);
        expect(store.getState().rtcConnection.status).toBe("ready");
    });

    it("doRtcManagerInitialize", () => {
        const store = createStore({
            withRtcManager: true,
            initialState: {
                localMedia: {
                    ...localMediaInitialState,
                    stream: new MockMediaStream(),
                },
            },
        });

        store.dispatch(doRtcManagerInitialize());

        expect(mockRtcManager.addNewStream).toHaveBeenCalledTimes(1);
        expect(mockRtcManager.addNewStream).toHaveBeenCalledWith("0", store.getState().localMedia.stream, true, true);
        expect(store.getState().rtcConnection.rtcManagerInitialized).toBe(true);
    });
});
