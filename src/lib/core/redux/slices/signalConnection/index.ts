import { createSlice, ThunkDispatch, AnyAction, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../store";
import { createAppThunk } from "../../thunk";
import { createReactor, startAppListening } from "../../listenerMiddleware";
import { selectDeviceCredentialsRaw } from "../deviceCredentials";

import ServerSocket from "@whereby/jslib-media/src/utils/ServerSocket";
import { Credentials } from "../../../../../lib/api";
import { appLeft, selectAppWantsToJoin } from "../app";
import { signalEvents } from "./actions";

function forwardSocketEvents(socket: ServerSocket, dispatch: ThunkDispatch<RootState, unknown, AnyAction>) {
    socket.on("room_joined", (payload) => dispatch(signalEvents.roomJoined(payload)));
    socket.on("new_client", (payload) => dispatch(signalEvents.newClient(payload)));
    socket.on("client_left", (payload) => dispatch(signalEvents.clientLeft(payload)));
    socket.on("audio_enabled", (payload) => dispatch(signalEvents.audioEnabled(payload)));
    socket.on("video_enabled", (payload) => dispatch(signalEvents.videoEnabled(payload)));
    socket.on("client_metadata_received", (payload) => dispatch(signalEvents.clientMetadataReceived(payload)));
    socket.on("chat_message", (payload) => dispatch(signalEvents.chatMessage(payload)));
    socket.on("disconnect", () => dispatch(signalEvents.disconnect()));
    socket.on("room_knocked", (payload) => dispatch(signalEvents.roomKnocked(payload)));
    socket.on("room_session_ended", (payload) => dispatch(signalEvents.roomSessionEnded(payload)));
    socket.on("knocker_left", (payload) => dispatch(signalEvents.knockerLeft(payload)));
    socket.on("knock_handled", (payload) => dispatch(signalEvents.knockHandled(payload)));
    socket.on("screenshare_started", (payload) => dispatch(signalEvents.screenshareStarted(payload)));
    socket.on("screenshare_stopped", (payload) => dispatch(signalEvents.screenshareStopped(payload)));
    socket.on("cloud_recording_started", (payload) => dispatch(signalEvents.cloudRecordingStarted(payload)));
    socket.on("cloud_recording_stopped", () => dispatch(signalEvents.cloudRecordingStopped()));
    socket.on("streaming_stopped", () => dispatch(signalEvents.streamingStopped()));
}

const SIGNAL_BASE_URL = process.env.REACT_APP_SIGNAL_BASE_URL || "wss://signal.appearin.net";

function createSocket() {
    const parsedUrl = new URL(SIGNAL_BASE_URL);
    const socketHost = parsedUrl.origin;

    const socketOverrides = {
        autoConnect: false,
    };

    return new ServerSocket(socketHost, socketOverrides);
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
                status: "disconnected",
            };
        },
        socketReconnecting: (state) => {
            return {
                ...state,
                status: "reconnect",
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
});

export const { deviceIdentifying, deviceIdentified, socketConnected, socketConnecting, socketDisconnected } =
    signalConnectionSlice.actions;

/**
 * Action creators
 */
export const doSignalSocketConnect = createAppThunk(() => {
    return (dispatch, getState) => {
        if (selectSignalConnectionSocket(getState())) {
            return;
        }

        dispatch(socketConnecting());

        const socket = createSocket();

        socket.on("connect", () => dispatch(socketConnected(socket)));
        socket.on("device_identified", () => dispatch(deviceIdentified()));
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
    dispatch(socketReconnecting());
    if (deviceCredentialsRaw.data) {
        dispatch(doSignalIdentifyDevice({ deviceCredentials: deviceCredentialsRaw.data }));
    }
});

export const { socketReconnecting } = signalConnectionSlice.actions;

/**
 * Selectors
 */
export const selectSignalConnectionRaw = (state: RootState) => state.signalConnection;
export const selectSignalIsIdentifyingDevice = (state: RootState) => state.signalConnection.isIdentifyingDevice;
export const selectSignalConnectionDeviceIdentified = (state: RootState) => state.signalConnection.deviceIdentified;
export const selectSignalStatus = (state: RootState) => state.signalConnection.status;
export const selectSignalConnectionSocket = (state: RootState) => state.signalConnection.socket;

/**
 * Reactors
 */
startAppListening({
    actionCreator: appLeft,
    effect: (_, { dispatch }) => {
        dispatch(doSignalDisconnect());
    },
});

export const selectShouldConnectSignal = createSelector(
    selectAppWantsToJoin,
    selectSignalStatus,
    (wantsToJoin, signalStatus) => {
        if (wantsToJoin && ["", "reconnect"].includes(signalStatus)) {
            return true;
        }
        return false;
    }
);

createReactor([selectShouldConnectSignal], ({ dispatch }, shouldConnectSignal) => {
    if (shouldConnectSignal) {
        dispatch(doSignalSocketConnect());
    }
});

export const selectShouldIdentifyDevice = createSelector(
    selectDeviceCredentialsRaw,
    selectSignalStatus,
    selectSignalConnectionDeviceIdentified,
    selectSignalIsIdentifyingDevice,
    (deviceCredentialsRaw, signalStatus, deviceIdentified, isIdentifyingDevice) => {
        if (deviceCredentialsRaw.data && signalStatus === "connected" && !deviceIdentified && !isIdentifyingDevice) {
            return true;
        }
        return false;
    }
);

createReactor(
    [selectShouldIdentifyDevice, selectDeviceCredentialsRaw],
    ({ dispatch }, shouldIdentifyDevice, deviceCredentialsRaw) => {
        if (shouldIdentifyDevice && deviceCredentialsRaw.data) {
            dispatch(doSignalIdentifyDevice({ deviceCredentials: deviceCredentialsRaw.data }));
        }
    }
);
