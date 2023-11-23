import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import { ConnectionStatus } from "../../../RoomConnection";
import { createReactor } from "../listenerMiddleware";
import { RootState } from "../store";
import { createAppAsyncThunk } from "../asyncThunk";
import {
    selectAppDisplayName,
    selectAppLocalMedia,
    selectAppRoomKey,
    selectAppRoomName,
    selectAppSdkVersion,
} from "./app";
import { selectOrganizationId } from "./organization";
import { selectSignalConnectionRaw, signalEvents } from "./signalConnection";

export interface RoomConnectionState {
    status: ConnectionStatus;
    error: unknown;
}

const initialState: RoomConnectionState = {
    status: "initializing",
    error: null,
};

export const roomConnectionSlice = createSlice({
    initialState,
    name: "roomConnection",
    reducers: {
        doRoomConnectionStatusChanged: (state, action: PayloadAction<{ status: ConnectionStatus }>) => {
            return {
                ...state,
                status: action.payload.status,
            };
        },
    },
    extraReducers: (builder) => {
        builder.addCase(doConnectRoom.pending, (state) => {
            return {
                ...state,
                status: "connecting",
            };
        });

        builder.addCase(signalEvents.roomJoined, (state) => {
            //TODO: Handle error
            return {
                ...state,
                status: "connected",
            };
        });
    },
});

export const doConnectRoom = createAppAsyncThunk("roomConnection/doConnectRoom", async (_, { getState }) => {
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
});

export const { doRoomConnectionStatusChanged } = roomConnectionSlice.actions;

export const selectRoomConnectionRaw = (state: RootState) => state.roomConnection;
export const selectRoomConnectionStatus = (state: RootState) => state.roomConnection.status;

createReactor((_, { dispatch, getState }) => {
    const hasOrganizationIdFetched = selectOrganizationId(getState());
    const roomConnectionStatus = selectRoomConnectionStatus(getState());
    const signalIdentified = selectSignalConnectionRaw(getState()).deviceIdentified;

    if (signalIdentified && hasOrganizationIdFetched && roomConnectionStatus === "initializing") {
        dispatch(doConnectRoom());
    }
});
