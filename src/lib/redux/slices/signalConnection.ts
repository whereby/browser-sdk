import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import ServerSocket from "@whereby/jslib-media/src/utils/ServerSocket";
import { Credentials } from "~/lib/api";
import { startAppListening } from "../listenerMiddleware";
import { selectAppWantsToJoin } from "./app";
import { selectDeviceCredentialsRaw } from "./deviceCredentials";

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

export interface SignalConnectionState {
    deviceIdentified: boolean;
    isIdentifyingDevice: boolean;
    status: "connected" | "connecting" | "disconnected" | "reconnect" | "";
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
        doSignalSocketConnect: (state) => {
            let socket = null;
            if (!state.socket) {
                socket = createSocket();
                socket.connect();
            }

            return {
                ...state,
                status: "connecting",
                ...(socket ? { socket } : {}),
            };
        },
        doSignalIdentifyDevice: (
            state,
            action: PayloadAction<{ deviceCredentials: Credentials | null | undefined }>
        ) => {
            const { deviceCredentials } = action.payload;
            state.socket?.emit("identify_device", { deviceCredentials });
            return {
                ...state,
                isIdentifyingDevice: true,
            };
        },
    },
});

export const { doSignalSocketConnect, doSignalIdentifyDevice } = signalConnectionSlice.actions;

export const selectSignalConnectionRaw = (state: RootState) => state.signalConnection;
export const selectSignalStatus = (state: RootState) => state.signalConnection.status;

startAppListening({
    predicate: (action, currentState, previousState) => {
        const wantsToJoin = selectAppWantsToJoin(currentState);
        const signalConnectionStatus = selectSignalStatus(currentState);

        if (wantsToJoin && signalConnectionStatus === "") {
            return true;
        }
        return false;
    },
    effect: (action, listenerApi) => {
        listenerApi.dispatch(doSignalSocketConnect());
    },
});

startAppListening({
    predicate: (action, currentState, previousState) => {
        const deviceCredentialsRaw = selectDeviceCredentialsRaw(currentState);
        const signalConnectionRaw = selectSignalConnectionRaw(currentState);

        if (
            deviceCredentialsRaw.data &&
            !signalConnectionRaw.deviceIdentified &&
            !signalConnectionRaw.isIdentifyingDevice
        ) {
            return true;
        }
        return false;
    },
    effect: (action, listenerApi) => {
        const deviceCredentialsRaw = selectDeviceCredentialsRaw(listenerApi.getState());
        listenerApi.dispatch(doSignalIdentifyDevice({ deviceCredentials: deviceCredentialsRaw.data }));
    },
});
