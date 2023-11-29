import { createSlice, createAction, ThunkDispatch, AnyAction, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { createAppThunk } from "../thunk";
import { createReactor } from "../listenerMiddleware";
import { selectDeviceCredentialsRaw } from "./deviceCredentials";

import ServerSocket, {
    AudioEnabledEvent,
    ChatMessage,
    ClientLeftEvent,
    ClientMetadataReceivedEvent,
    CloudRecordingStartedEvent,
    KnockerLeftEvent,
    KnockAcceptedEvent,
    KnockRejectedEvent,
    NewClientEvent,
    RoomJoinedEvent,
    RoomKnockedEvent,
    ScreenshareStartedEvent,
    ScreenshareStoppedEvent,
    VideoEnabledEvent,
} from "@whereby/jslib-media/src/utils/ServerSocket";
import { Credentials } from "~/lib/api";
import { appLeft, selectAppWantsToJoin } from "./app";

function createSignalEventAction<T>(name: string) {
    return createAction<T>(`signalConnection/event/${name}`);
}

export const signalEvents = {
    audioEnabled: createSignalEventAction<AudioEnabledEvent>("audioEnabled"),
    chatMessage: createSignalEventAction<ChatMessage>("chatMessage"),
    clientLeft: createSignalEventAction<ClientLeftEvent>("clientLeft"),
    clientMetadataReceived: createSignalEventAction<ClientMetadataReceivedEvent>("clientMetadataReceived"),
    cloudRecordingStarted: createSignalEventAction<CloudRecordingStartedEvent>("cloudRecordingStarted"),
    cloudRecordingStopped: createSignalEventAction<void>("cloudRecordingStopped"),
    knockerLeft: createSignalEventAction<KnockerLeftEvent>("knockerLeft"),
    knockHandled: createSignalEventAction<KnockAcceptedEvent | KnockRejectedEvent>("knockHandled"),
    newClient: createSignalEventAction<NewClientEvent>("newClient"),
    roomJoined: createSignalEventAction<RoomJoinedEvent>("roomJoined"),
    roomKnocked: createSignalEventAction<RoomKnockedEvent>("roomKnocked"),
    screenshareStarted: createSignalEventAction<ScreenshareStartedEvent>("screenshareStarted"),
    screenshareStopped: createSignalEventAction<ScreenshareStoppedEvent>("screenshareStopped"),
    streamingStopped: createSignalEventAction<void>("streamingStopped"),
    videoEnabled: createSignalEventAction<VideoEnabledEvent>("videoEnabled"),
};

function forwardSocketEvents(socket: ServerSocket, dispatch: ThunkDispatch<RootState, unknown, AnyAction>) {
    socket.on("room_joined", (payload) => dispatch(signalEvents.roomJoined(payload)));
    socket.on("new_client", (payload) => dispatch(signalEvents.newClient(payload)));
    socket.on("client_left", (payload) => dispatch(signalEvents.clientLeft(payload)));
    socket.on("audio_enabled", (payload) => dispatch(signalEvents.audioEnabled(payload)));
    socket.on("video_enabled", (payload) => dispatch(signalEvents.videoEnabled(payload)));
    socket.on("client_metadata_received", (payload) => dispatch(signalEvents.clientMetadataReceived(payload)));
    socket.on("chat_message", (payload) => dispatch(signalEvents.chatMessage(payload)));
    socket.on("room_knocked", (payload) => dispatch(signalEvents.roomKnocked(payload)));
    socket.on("knocker_left", (payload) => dispatch(signalEvents.knockerLeft(payload)));
    socket.on("knock_handled", (payload) => dispatch(signalEvents.knockHandled(payload)));
    socket.on("screenshare_started", (payload) => dispatch(signalEvents.screenshareStarted(payload)));
    socket.on("screenshare_stopped", (payload) => dispatch(signalEvents.screenshareStopped(payload)));
    socket.on("cloud_recording_started", (payload) => dispatch(signalEvents.cloudRecordingStarted(payload)));
    socket.on("cloud_recording_stopped", () => dispatch(signalEvents.cloudRecordingStopped()));
    socket.on("streaming_stopped", () => dispatch(signalEvents.streamingStopped()));
}

const SIGNAL_BASE_URL = process.env["REACT_APP_SIGNAL_BASE_URL"] || "wss://signal.appearin.net";

function createSocket() {
    const parsedUrl = new URL(SIGNAL_BASE_URL);
    const path = `${parsedUrl.pathname.replace(/^\/$/, "")}/protocol/socket.io/v4`;
    const SOCKET_HOST = parsedUrl.origin;

    const socketConf = {
        autoConnect: false,
        host: SOCKET_HOST,
        path,
        reconnectionDelay: 5000,
        reconnectionDelayMax: 30000,
        timeout: 10000,
        withCredentials: true,
    };

    return new ServerSocket(SOCKET_HOST, socketConf);
}

/**
 * Reducer
 */
export interface SignalConnectionState {
    deviceIdentified: boolean;
    isIdentifyingDevice: boolean;
    status: "connected" | "connecting" | "disconnected" | "reconnect" | ""; // the state of the underlying socket.io connection
    socket: ServerSocket | null;
}

const initialState: SignalConnectionState = {
    deviceIdentified: false,
    isIdentifyingDevice: false,
    status: "",
    socket: null,
};

export const signalConnectionSlice = createSlice({
    name: "signalConnection",
    initialState,
    reducers: {
        socketConnecting: (state) => {
            return {
                ...state,
                status: "connecting",
            };
        },
        socketConnected: (state, action: PayloadAction<ServerSocket>) => {
            return {
                ...state,
                socket: action.payload,
                status: "connected",
            };
        },
        socketDisconnected: (state) => {
            return {
                ...state,
                socket: null,
                status: "disconnected",
            };
        },
        deviceIdentifying: (state) => {
            return {
                ...state,
                isIdentifyingDevice: true,
            };
        },
        deviceIdentified: (state) => {
            return {
                ...state,
                deviceIdentified: true,
                isIdentifyingDevice: false,
            };
        },
    },
    extraReducers: (builder) => {
        builder.addCase(appLeft, (state) => {
            return {
                ...state,
                socket: null,
                status: "disconnected",
            };
        });
    },
});

export const { deviceIdentifying, deviceIdentified, socketConnected, socketConnecting, socketDisconnected } =
    signalConnectionSlice.actions;

/**
 * Action creators
 */
const doSignalSocketConnect = createAppThunk(() => {
    return (dispatch, getState) => {
        if (selectSignalConnectionSocket(getState())) {
            return;
        }

        dispatch(socketConnecting());

        const socket = createSocket();

        socket.on("connect", () => dispatch(socketConnected(socket)));
        socket.on("device_identified", () => dispatch(deviceIdentified()));
        socket.on("disconnect", () => dispatch(doSignalDisconnect()));
        socket.getManager().on("reconnect", () => dispatch(doSignalReconnect()));
        forwardSocketEvents(socket, dispatch);

        socket.connect();
    };
});

export const doSignalIdentifyDevice = createAppThunk(
    ({ deviceCredentials }: { deviceCredentials: Credentials }) =>
        (dispatch, getState) => {
            const state = getState();
            const signalSocket = selectSignalConnectionSocket(state);

            if (!signalSocket) {
                return;
            }

            signalSocket.emit("identify_device", { deviceCredentials });
            dispatch(deviceIdentifying());
        }
);

export const doSignalDisconnect = createAppThunk(() => (dispatch, getState) => {
    const socket = selectSignalConnectionRaw(getState()).socket;
    socket?.emit("leave_room");
    socket?.disconnect();
    dispatch(socketDisconnected());
});

export const doSignalReconnect = createAppThunk(() => (dispatch, getState) => {
    const deviceCredentialsRaw = selectDeviceCredentialsRaw(getState());
    if (deviceCredentialsRaw.data) {
        dispatch(doSignalIdentifyDevice({ deviceCredentials: deviceCredentialsRaw.data }));
    }
});

/**
 * Selectors
 */
export const selectSignalConnectionRaw = (state: RootState) => state.signalConnection;
export const selectSignalStatus = (state: RootState) => state.signalConnection.status;
export const selectSignalConnectionSocket = (state: RootState) => state.signalConnection.socket;

/**
 * Reactors
 */

createReactor([selectAppWantsToJoin, selectSignalStatus], ({ dispatch }, wantsToJoin, signalStatus) => {
    if (wantsToJoin && signalStatus === "") {
        dispatch(doSignalSocketConnect());
    }
});

createReactor(
    [selectDeviceCredentialsRaw, selectSignalConnectionRaw],
    ({ dispatch }, deviceCredentialsRaw, signalConnectionRaw) => {
        if (
            deviceCredentialsRaw.data &&
            signalConnectionRaw.status === "connected" &&
            !signalConnectionRaw.deviceIdentified &&
            !signalConnectionRaw.isIdentifyingDevice
        ) {
            dispatch(doSignalIdentifyDevice({ deviceCredentials: deviceCredentialsRaw.data }));
        }
    }
);
