import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { createAppAsyncThunk } from "../asyncThunk";
import ServerSocket from "@whereby/jslib-media/src/utils/ServerSocket";
import { Credentials } from "~/lib/api";
import { startAppListening } from "../listenerMiddleware";
import {
    selectAppDisplayName,
    selectAppLocalMedia,
    selectAppRaw,
    selectAppRoomKey,
    selectAppRoomName,
    selectAppSdkVersion,
    selectAppWantsToJoin,
} from "./app";
import { selectDeviceCredentialsRaw } from "./deviceCredentials";
import { selectOrganizationId, selectOrganizationRaw } from "./organization";
import {
    doHandleClientLeft,
    doHandleKnockHandled,
    doHandleNewClient,
    doHandleScreenshareStarted,
    doHandleScreenshareStopped,
    doHandleWaitingParticipantJoined,
    doHandleWaitingParticipantLeft,
    doParticipantAudioEnabled,
    doParticipantMetadataChanged,
    doParticipantVideoEnabled,
    doRoomJoined,
} from "./room";
import { doChatMessageReceived } from "./chat";
import { doConnectRoom, doRoomConnectionStatusChanged } from "./roomConnection";
import { doHandleCloudRecordingStarted, doHandleCloudRecordingStopped } from "./cloudRecording";
import { doHandleStreamingStopped } from "./streaming";

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

        /* socket.once("device_identified", () => {
            dispatch(doSignalJoinRoom());
        });*/

        socket.on("room_joined", (payload) => {
            dispatch(doRoomJoined(payload));
        });

        socket.on("new_client", (payload) => {
            dispatch(doHandleNewClient(payload));
        });

        socket.on("client_left", (payload) => {
            dispatch(doHandleClientLeft(payload));
        });

        socket.on("audio_enabled", (payload) => {
            dispatch(doParticipantAudioEnabled(payload));
        });

        socket.on("video_enabled", (payload) => {
            dispatch(doParticipantVideoEnabled(payload));
        });

        socket.on("client_metadata_received", (payload) => {
            dispatch(doParticipantMetadataChanged(payload));
        });

        socket.on("chat_message", (payload) => {
            dispatch(doChatMessageReceived(payload));
        });

        socket.on("room_knocked", (payload) => {
            dispatch(doHandleWaitingParticipantJoined(payload));
        });

        socket.on("knocker_left", (payload) => {
            dispatch(doHandleWaitingParticipantLeft(payload));
        });

        socket.on("knock_handled", (payload) => {
            dispatch(doHandleKnockHandled(payload));
        });

        socket.on("screenshare_started", (payload) => {
            dispatch(doHandleScreenshareStarted(payload));
        });

        socket.on("screenshare_stopped", (payload) => {
            dispatch(doHandleScreenshareStopped(payload));
        });

        socket.on("cloud_recording_started", (payload) => {
            dispatch(doHandleCloudRecordingStarted(payload));
        });

        socket.on("cloud_recording_stopped", () => {
            dispatch(doHandleCloudRecordingStopped());
        });

        socket.on("streaming_stopped", () => {
            dispatch(doHandleStreamingStopped());
        });

        socket.getManager().on("reconnect", () => {
            dispatch(doSignalReconnect());
        });

        socket.on("disconnect", () => {
            dispatch(doSignalDisconnect());
        });
    }
);

export const doSignalReconnect = createAppAsyncThunk(
    "signalConnection/doSignalReconnect",
    async (payload, { getState, dispatch }) => {
        const deviceCredentialsRaw = selectDeviceCredentialsRaw(getState());
        dispatch(doSignalIdentifyDevice({ deviceCredentials: deviceCredentialsRaw.data }));
    }
);

export const doSignalDisconnect = createAppAsyncThunk(
    "signalConnection/doSignalDisconnect",
    async (payload, { dispatch, getState }) => {
        const socket = selectSignalConnectionRaw(getState()).socket;

        if (socket) {
            socket.emit("leave_room");
            socket.disconnect();
        }

        dispatch(doRoomConnectionStatusChanged({ status: "disconnected" }));
    }
);

export const doSignalKnock = createAppAsyncThunk(
    "signalConnection/doSignalKnock",
    async (payload, { dispatch, getState }) => {
        const state = getState();
        const socket = selectSignalConnectionRaw(state).socket;
        const app = selectAppRaw(state);
        const organization = selectOrganizationRaw(state);

        dispatch(doRoomConnectionStatusChanged({ status: "knocking" }));

        socket?.emit("knock_room", {
            displayName: app.displayName,
            imageUrl: null,
            kickFromOtherRooms: true,
            liveVideo: false,
            organizationId: organization.data?.organizationId,
            roomKey: app.roomKey,
            roomName: app.roomName,
            externalId: "",
        });
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
    },
    extraReducers: (builder) => {
        builder.addCase(doSignalListenForEvents.pending, (state) => {
            return {
                ...state,
                isListeningForEvents: true,
            };
        });
        builder.addCase(doConnectRoom.fulfilled, (state) => {
            return {
                ...state,
                status: "joining",
            };
        });
        builder.addCase(doConnectRoom.rejected, (state) => {
            return {
                ...state,
                status: "disconnected",
            };
        });
        builder.addCase(doSignalDisconnect.fulfilled, (state) => {
            return {
                ...state,
                status: "disconnected",
            };
        });
    },
});

export const { doSignalSocketConnect, doSignalIdentifyDevice } = signalConnectionSlice.actions;

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
    effect: (action, { dispatch }) => {
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
