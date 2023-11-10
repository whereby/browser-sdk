import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState, createAppAsyncThunk } from "../store";
import ServerSocket from "@whereby/jslib-media/src/utils/ServerSocket";
import { Credentials } from "~/lib/api";
import { startAppListening } from "../listenerMiddleware";
import {
    selectAppDisplayName,
    selectAppLocalMedia,
    selectAppRoomKey,
    selectAppRoomName,
    selectAppSdkVersion,
    selectAppWantsToJoin,
} from "./app";
import { selectDeviceCredentialsRaw } from "./deviceCredentials";
import { selectOrganizationId } from "./organization";
import { doRoomJoined } from "./room";

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
    status: "connected" | "connecting" | "disconnected" | "reconnect" | "" | "joining";
    socket: ServerSocket | null;
    isListeningForEvents: boolean;
}

const initialState: SignalConnectionState = {
    deviceIdentified: false,
    isIdentifyingDevice: false,
    status: "",
    socket: null,
    isListeningForEvents: false,
};

export const doSignalListenForEvents = createAppAsyncThunk(
    "signalConnection/doSignalListenForEvents",
    async (payload, { dispatch, getState }) => {
        const state = getState();
        const socket = selectSignalConnectionRaw(state).socket;

        if (!socket) {
            return;
        }

        socket.once("device_identified", () => {
            dispatch(doSignalJoinRoom());
        });

        socket.on("room_joined", (payload) => {
            dispatch(doRoomJoined(payload));
        });
    }
);

export const doSignalJoinRoom = createAppAsyncThunk(
    "signalConnection/doSignalJoinRoom",
    async (payload, { getState }) => {
        const state = getState();
        const socket = selectSignalConnectionRaw(state).socket;
        const roomName = selectAppRoomName(state);
        const roomKey = selectAppRoomKey(state);
        const displayName = selectAppDisplayName(state);
        const sdkVersion = selectAppSdkVersion(state);
        const organizationId = selectOrganizationId(state);
        const localMedia = selectAppLocalMedia(state);

        socket?.emit("join_room", {
            avatarUrl: null,
            config: {
                isAudioEnabled: localMedia?.isMicrophoneEnabled || false,
                isVideoEnabled: localMedia?.isCameraEnabled || false,
            },
            deviceCapabilities: { canScreenshare: true },
            displayName: displayName,
            isCoLocated: false,
            isDevicePermissionDenied: false,
            kickFromOtherRooms: false,
            organizationId: organizationId,
            roomKey: roomKey,
            roomName: roomName,
            selfId: "",
            userAgent: `browser-sdk:${sdkVersion || "unknown"}`,
            externalId: null,
        });

        localMedia?.start();
        return true;
    }
);

export const doSignalEnableAudio = createAppAsyncThunk(
    "signalConnection/doSignalEnableAudio",
    async (payload: { enabled: boolean }, { getState }) => {
        const state = getState();
        const socket = selectSignalConnectionRaw(state).socket;

        socket?.emit("enable_audio", { enabled: payload.enabled });
    }
);

export const doSignalEnableVideo = createAppAsyncThunk(
    "signalConnection/doSignalEnableVideo",
    async (payload: { enabled: boolean }, { getState }) => {
        const state = getState();
        const socket = selectSignalConnectionRaw(state).socket;

        socket?.emit("enable_video", { enabled: payload.enabled });
    }
);

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
        doSignalDeviceIdentified: (state) => {
            return {
                ...state,
                deviceIdentified: true,
                isIdentifyingDevice: false,
            };
        },
        doSignalDisconnect: (state) => {
            state.socket?.emit("leave_room");
            state.socket?.disconnect();
            return {
                ...state,
                deviceIdentified: false,
                isIdentifyingDevice: false,
                socket: null,
                status: "disconnected",
            };
        },
    },
    extraReducers: (builder) => {
        builder.addCase(doSignalListenForEvents.pending, (state) => {
            return {
                ...state,
                isListeningForEvents: true,
            };
        });
        builder.addCase(doSignalJoinRoom.fulfilled, (state) => {
            return {
                ...state,
                status: "joining",
            };
        });
    },
});

export const { doSignalSocketConnect, doSignalIdentifyDevice, doSignalDisconnect } = signalConnectionSlice.actions;

export const selectSignalConnectionRaw = (state: RootState) => state.signalConnection;
export const selectSignalStatus = (state: RootState) => state.signalConnection.status;
export const selectSignalIsListeningForEvents = (state: RootState) => state.signalConnection.isListeningForEvents;

startAppListening({
    predicate: (action, currentState) => {
        const signalConnectionRaw = selectSignalConnectionRaw(currentState);
        const isListeningForEvents = selectSignalIsListeningForEvents(currentState);

        if (!!signalConnectionRaw.socket && !isListeningForEvents) {
            return true;
        }
        return false;
    },
    effect: (action, { dispatch, extra }) => {
        dispatch(doSignalListenForEvents());
    },
});

startAppListening({
    predicate: (action, currentState) => {
        const wantsToJoin = selectAppWantsToJoin(currentState);
        const signalConnectionStatus = selectSignalStatus(currentState);

        if ((wantsToJoin && signalConnectionStatus === "") || signalConnectionStatus === "disconnected") {
            return true;
        }
        return false;
    },
    effect: (action, { dispatch }) => {
        dispatch(doSignalSocketConnect());
    },
});

startAppListening({
    predicate: (action, currentState) => {
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
    effect: (action, { dispatch, getState }) => {
        const deviceCredentialsRaw = selectDeviceCredentialsRaw(getState());

        dispatch(doSignalIdentifyDevice({ deviceCredentials: deviceCredentialsRaw.data }));
    },
});
