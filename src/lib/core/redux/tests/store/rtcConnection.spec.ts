import { createStore, mockRtcManager } from "../store.setup";
import {
    doHandleAcceptStreams,
    doConnectRtc,
    doDisconnectRtc,
    doRtcReportStreamResolution,
    doRtcManagerInitialize,
} from "../../slices/rtcConnection";
import { randomRemoteParticipant, randomString } from "../../../../__mocks__/appMocks";
import MockMediaStream from "../../../../../lib/__mocks__/MediaStream";
import RtcManagerDispatcher from "@whereby/jslib-media/src/webrtc/RtcManagerDispatcher";
import { initialState as localMediaInitialState } from "../../slices/localMedia";
import { diff } from "deep-object-diff";

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

        const before = store.getState().rtcConnection;

        store.dispatch(doConnectRtc());

        const after = store.getState().rtcConnection;

        expect(RtcManagerDispatcher).toHaveBeenCalledTimes(1);
        expect(diff(before, after)).toEqual({
            dispatcherCreated: true,
            rtcManagerDispatcher: expect.any(RtcManagerDispatcher),
        });
    });

    it("doDisconnectRtc", () => {
        const store = createStore({ withRtcManager: true });

        const before = store.getState().rtcConnection;

        store.dispatch(doDisconnectRtc());

        const after = store.getState().rtcConnection;

        expect(mockRtcManager.disconnectAll).toHaveBeenCalledTimes(1);
        expect(diff(before, after)).toEqual({
            dispatcherCreated: false,
            rtcManager: null,
            rtcManagerDispatcher: null,
            rtcManagerInitialized: false,
            status: "",
        });
    });

    it("doRtcReportStreamResolution", () => {
        const store = createStore({ withRtcManager: true });
        const streamId = randomString("streamId");
        const resolution = { width: 100, height: 100 };

        const before = store.getState().rtcConnection;

        store.dispatch(doRtcReportStreamResolution({ streamId, ...resolution }));

        const after = store.getState().rtcConnection;

        expect(mockRtcManager.updateStreamResolution).toHaveBeenCalledTimes(1);
        expect(mockRtcManager.updateStreamResolution).toHaveBeenCalledWith(streamId, null, resolution);
        expect(diff(before, after)).toEqual({
            reportedStreamResolutions: {
                [streamId]: resolution,
            },
        });
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
