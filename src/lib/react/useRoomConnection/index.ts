import * as React from "react";
import { RoomConnectionOptions, RoomConnectionState } from "./types";
import { Store, createStore, observeStore } from "../../core/redux/store";
import VideoView from "../VideoView";
import { createServices } from "../../services";
import { doSendChatMessage } from "../../core/redux/slices/chat";
import { doStartCloudRecording, doStopCloudRecording } from "../../core/redux/slices/cloudRecording";
import { doAcceptWaitingParticipant, doRejectWaitingParticipant } from "../../core/redux/slices/waitingParticipants";
import { doSetDisplayName } from "../../core/redux/slices/localParticipant";
import {
    doToggleCameraEnabled,
    doToggleMicrophoneEnabled,
    doStartScreenshare,
    doStopScreenshare,
} from "../../core/redux/slices/localMedia";
import { appLeft, doAppJoin } from "../../core/redux/slices/app";
import { selectRoomConnectionState } from "./selector";

const initialState: RoomConnectionState = {
    chatMessages: [],
    remoteParticipants: [],
    connectionStatus: "initializing",
    screenshares: [],
    waitingParticipants: [],
};

interface UseRoomConnectionOptions extends Omit<RoomConnectionOptions, "localMedia"> {
    localMedia?: Store;
}

interface RoomConnectionActions {
    sendChatMessage(text: string): void;
    // knock(): void;
    setDisplayName(displayName: string): void;
    toggleCamera(enabled?: boolean): void;
    toggleMicrophone(enabled?: boolean): void;
    acceptWaitingParticipant(participantId: string): void;
    rejectWaitingParticipant(participantId: string): void;
    startCloudRecording(): void;
    startScreenshare(): void;
    stopCloudRecording(): void;
    stopScreenshare(): void;
}

type VideoViewComponentProps = Omit<React.ComponentProps<typeof VideoView>, "onResize">;

interface RoomConnectionComponents {
    VideoView: (props: VideoViewComponentProps) => ReturnType<typeof VideoView>;
}

export type RoomConnectionRef = {
    state: RoomConnectionState;
    actions: RoomConnectionActions;
    components: RoomConnectionComponents;
    _ref: Store;
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
        // Need to find a way to inject the services here
        if (roomConnectionOptions.localMedia) {
            return roomConnectionOptions.localMedia;
        }
        const services = createServices();
        return createStore({ injectServices: services });
    });
    const [roomConnectionState, setRoomConnectionState] = React.useState(initialState);

    React.useEffect(() => {
        const unsubscribe = observeStore(store, selectRoomConnectionState, setRoomConnectionState);
        const url = new URL(roomUrl); // Throw if invalid Whereby room url
        const searchParams = new URLSearchParams(url.search);
        const roomKey = searchParams.get("roomKey");

        store.dispatch(
            doAppJoin({
                roomUrl,
                roomKey,
                displayName: roomConnectionOptions.displayName || "Guest",
                sdkVersion: "1.0.0",
            })
        );
        return () => {
            unsubscribe();
            store.dispatch(appLeft());
        };
    }, []);

    const sendChatMessage = React.useCallback((text: string) => store.dispatch(doSendChatMessage({ text })), [store]);
    // const knock = React.useCallback(() => store.dispatch(doKnock()), [store]);
    const setDisplayName = React.useCallback(
        (displayName: string) => store.dispatch(doSetDisplayName({ displayName })),
        [store]
    );
    const toggleCamera = React.useCallback(
        (enabled?: boolean) => store.dispatch(doToggleCameraEnabled({ enabled })),
        [store]
    );
    const toggleMicrophone = React.useCallback(
        (enabled?: boolean) => store.dispatch(doToggleMicrophoneEnabled({ enabled })),
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
            // knock,
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
            VideoView,
        },
        _ref: store,
    };
}
