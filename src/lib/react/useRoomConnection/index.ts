import * as React from "react";
import { RoomConnectionState, UseRoomConnectionOptions, RoomConnectionRef, VideoViewComponentProps } from "./types";
import { Store, createStore, observeStore } from "../../core/redux/store";
import VideoView from "../VideoView";
import { createServices } from "../../services";
import { doSendChatMessage } from "../../core/redux/slices/chat";
import { doStartCloudRecording, doStopCloudRecording } from "../../core/redux/slices/cloudRecording";
import { doAcceptWaitingParticipant, doRejectWaitingParticipant } from "../../core/redux/slices/waitingParticipants";
import { doSetDisplayName } from "../../core/redux/slices/localParticipant";
import { toggleCameraEnabled, toggleMicrophoneEnabled } from "../../core/redux/slices/localMedia";
import { doStartScreenshare, doStopScreenshare } from "../../core/redux/slices/localScreenshare";
import { appLeft, doAppJoin } from "../../core/redux/slices/app";
import { selectRoomConnectionState } from "./selector";
import { doKnockRoom } from "../../core/redux/slices/roomConnection";
import { doRtcReportStreamResolution } from "../../core/redux/slices/rtcConnection";
import { sdkVersion } from "../../version";

const initialState: RoomConnectionState = {
    chatMessages: [],
    remoteParticipants: [],
    connectionStatus: "initializing",
    screenshares: [],
    waitingParticipants: [],
};

const defaultRoomConnectionOptions: UseRoomConnectionOptions = {
    localMediaOptions: {
        audio: true,
        video: true,
    },
};

export function useRoomConnection(
    roomUrl: string,
    roomConnectionOptions = defaultRoomConnectionOptions
): RoomConnectionRef {
    const [store] = React.useState<Store>(() => {
        if (roomConnectionOptions.localMedia) {
            return roomConnectionOptions.localMedia.store;
        }
        const services = createServices();
        return createStore({ injectServices: services });
    });
    const [boundVideoView, setBoundVideoView] = React.useState<(props: VideoViewComponentProps) => JSX.Element>();
    const [roomConnectionState, setRoomConnectionState] = React.useState(initialState);

    React.useEffect(() => {
        const unsubscribe = observeStore(store, selectRoomConnectionState, setRoomConnectionState);
        const url = new URL(roomUrl); // Throw if invalid Whereby room url
        const searchParams = new URLSearchParams(url.search);
        const roomKey = searchParams.get("roomKey");

        store.dispatch(
            doAppJoin({
                displayName: roomConnectionOptions.displayName || "Guest",
                localMediaOptions: roomConnectionOptions.localMedia
                    ? undefined
                    : roomConnectionOptions.localMediaOptions,
                roomKey,
                roomUrl,
                sdkVersion: sdkVersion,
                externalId: roomConnectionOptions.externalId || null,
            })
        );
        return () => {
            unsubscribe();
            store.dispatch(appLeft());
        };
    }, []);

    React.useEffect(() => {
        if (store && !boundVideoView) {
            setBoundVideoView(() => (props: VideoViewComponentProps): JSX.Element => {
                return React.createElement(
                    VideoView as React.ComponentType<VideoViewComponentProps>,
                    Object.assign({}, props, {
                        onResize: ({
                            stream,
                            width,
                            height,
                        }: {
                            stream: MediaStream;
                            width: number;
                            height: number;
                        }) => {
                            store.dispatch(
                                doRtcReportStreamResolution({
                                    streamId: stream.id,
                                    width,
                                    height,
                                })
                            );
                        },
                    })
                );
            });
        }
    }, [store, boundVideoView]);

    const sendChatMessage = React.useCallback((text: string) => store.dispatch(doSendChatMessage({ text })), [store]);
    const knock = React.useCallback(() => store.dispatch(doKnockRoom()), [store]);
    const setDisplayName = React.useCallback(
        (displayName: string) => store.dispatch(doSetDisplayName({ displayName })),
        [store]
    );
    const toggleCamera = React.useCallback(
        (enabled?: boolean) => store.dispatch(toggleCameraEnabled({ enabled })),
        [store]
    );
    const toggleMicrophone = React.useCallback(
        (enabled?: boolean) => store.dispatch(toggleMicrophoneEnabled({ enabled })),
        [store]
    );
    const acceptWaitingParticipant = React.useCallback(
        (participantId: string) => store.dispatch(doAcceptWaitingParticipant({ participantId })),
        [store]
    );
    const rejectWaitingParticipant = React.useCallback(
        (participantId: string) => store.dispatch(doRejectWaitingParticipant({ participantId })),
        [store]
    );
    const startCloudRecording = React.useCallback(() => store.dispatch(doStartCloudRecording()), [store]);
    const startScreenshare = React.useCallback(() => store.dispatch(doStartScreenshare()), [store]);
    const stopCloudRecording = React.useCallback(() => store.dispatch(doStopCloudRecording()), [store]);
    const stopScreenshare = React.useCallback(() => store.dispatch(doStopScreenshare()), [store]);

    return {
        state: roomConnectionState,
        actions: {
            sendChatMessage,
            knock,
            setDisplayName,
            toggleCamera,
            toggleMicrophone,
            acceptWaitingParticipant,
            rejectWaitingParticipant,
            startCloudRecording,
            startScreenshare,
            stopCloudRecording,
            stopScreenshare,
        },
        components: {
            VideoView: boundVideoView || VideoView,
        },
        _ref: store,
    };
}
