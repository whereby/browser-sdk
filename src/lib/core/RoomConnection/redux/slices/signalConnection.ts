import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { createAppAsyncThunk, createAppThunk } from "../asyncThunk";
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
        socketConnected: (state) => {
            return {
                ...state,
                status: "connected",
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

export const { deviceIdentifying, deviceIdentified, socketConnected, socketConnecting } = signalConnectionSlice.actions;

/**
 * Action creators
 */
const doSignalSocketConnect = createAppThunk(() => {
    return (dispatch, getState) => {
        dispatch(socketConnecting());

        if (selectSignalConnectionSocket(getState())) {
            return;
        }

        const socket = createSocket();

        socket.on("connect", () => {
            dispatch(socketConnected());
        });

        socket.once("device_identified", () => {
            //dispatch(doSignalJoinRoom());
        });

        socket.on("room_joined", (payload) => {
            //dispatch(doRoomJoined(payload));
        });

        socket.on("new_client", (payload) => {
            //dispatch(doHandleNewClient(payload));
        });

        socket.on("client_left", (payload) => {
            //dispatch(doHandleClientLeft(payload));
        });

        socket.on("audio_enabled", (payload) => {
            //dispatch(doParticipantAudioEnabled(payload));
        });

        socket.on("video_enabled", (payload) => {
            //dispatch(doParticipantVideoEnabled(payload));
        });

        socket.on("client_metadata_received", (payload) => {
            //dispatch(doParticipantMetadataChanged(payload));
        });

        socket.on("chat_message", (payload) => {
            //dispatch(doChatMessageReceived(payload));
        });

        socket.on("room_knocked", (payload) => {
            //dispatch(doHandleWaitingParticipantJoined(payload));
        });

        socket.on("knocker_left", (payload) => {
            //dispatch(doHandleWaitingParticipantLeft(payload));
        });

        socket.on("knock_handled", (payload) => {
            //dispatch(doHandleKnockHandled(payload));
        });

        socket.on("screenshare_started", (payload) => {
            //dispatch(doHandleScreenshareStarted(payload));
        });

        socket.on("screenshare_stopped", (payload) => {
            //dispatch(doHandleScreenshareStopped(payload));
        });

        socket.on("cloud_recording_started", (payload) => {
            //dispatch(doHandleCloudRecordingStarted(payload));
        });

        socket.on("cloud_recording_stopped", () => {
            //dispatch(doHandleCloudRecordingStopped());
        });

        socket.on("streaming_stopped", () => {
            //dispatch(doHandleStreamingStopped());
        });

        socket.getManager().on("reconnect", () => {
            //dispatch(doSignalReconnect());
        });

        socket.on("disconnect", () => {
            //dispatch(doSignalDisconnect());
        });

        socket.connect();

        return true;
    };
});

export const doSignalIdentifyDevice = createAppThunk((arg: any) => (dispatch, getState) => {
    const state = getState();
    const signalSocket = selectSignalConnectionSocket(state);

    if (!signalSocket) {
        return;
    }

    signalSocket.emit("identify_device", { deviceCredentials: arg.deviceCredentials });
    dispatch(deviceIdentifying());
});

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

export const doSignalReconnect = createAppAsyncThunk(
    "signalConnection/doSignalReconnect",
    async (payload, { getState, dispatch }) => {
        const deviceCredentialsRaw = selectDeviceCredentialsRaw(getState());
        dispatch(doSignalIdentifyDevice({ deviceCredentials: deviceCredentialsRaw.data }));
    }
);

/**
 * Selectors
 */
export const selectSignalConnectionRaw = (state: RootState) => state.signalConnection;
export const selectSignalStatus = (state: RootState) => state.signalConnection.status;
export const selectSignalConnectionSocket = (state: RootState) => state.signalConnection.socket;

/**
 * Reactors
 */
startAppListening({
    predicate: (_, currentState) => {
        const wantsToJoin = selectAppWantsToJoin(currentState);
        const signalConnectionStatus = selectSignalStatus(currentState);

        if (wantsToJoin && signalConnectionStatus === "") {
            return true;
        }
        return false;
    },

    effect: (_, { dispatch }) => {
        //dispatch(socketConnecting());
        dispatch(doSignalSocketConnect());
    },
});

startAppListening({
    predicate: (_, currentState, previousState) => {
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
    effect: (_, { dispatch, getState }) => {
        const deviceCredentialsRaw = selectDeviceCredentialsRaw(getState());

        dispatch(doSignalIdentifyDevice({ deviceCredentials: deviceCredentialsRaw.data }));
    },
});
