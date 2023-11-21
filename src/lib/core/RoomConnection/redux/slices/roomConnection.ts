import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import { ConnectionStatus } from "../../../RoomConnection";
import { startAppListening } from "../listenerMiddleware";
import { RootState } from "../store";
import { createAppAsyncThunk } from "../asyncThunk";
import {
    selectAppDisplayName,
    selectAppLocalMedia,
    selectAppRoomKey,
    selectAppRoomName,
    selectAppSdkVersion,
} from "./app";
import { selectHasFetchedDeviceCredentials } from "./deviceCredentials";
import { selectOrganizationId } from "./organization";
import { doRoomJoined } from "./room";
import { selectSignalConnectionRaw } from "./signalConnection";

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

        builder.addCase(doRoomJoined.fulfilled, (state) => {
            return {
                ...state,
                status: "connected",
            };
        });

        builder.addCase(doRoomJoined.rejected, (state) => {
            return {
                ...state,
                status: "room_locked", // TODO: fix, we might have other errors
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

startAppListening({
    predicate: (_, currentState) => {
        const hasFetchedDeviceCredentials = selectHasFetchedDeviceCredentials(currentState);
        const hasOrganizationIdFetched = !!selectOrganizationId(currentState);
        const roomConnectionStatus = selectRoomConnectionStatus(currentState);

        if (hasFetchedDeviceCredentials && hasOrganizationIdFetched && roomConnectionStatus !== "connecting") {
            return true;
        }
        return false;
    },
    effect: (_, { dispatch }) => {
        dispatch(doConnectRoom());
    },
});
