import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import { ConnectionStatus } from "../../../RoomConnection";
import { createReactor } from "../../../redux/listenerMiddleware";
import { RootState } from "../../../redux/store";
import { createAppThunk } from "../../../redux/asyncThunk";
import { selectAppDisplayName, selectAppRoomKey, selectAppRoomName, selectAppSdkVersion } from "./app";

import { selectOrganizationId } from "./organization";
import { selectSignalConnectionRaw, signalEvents } from "./signalConnection";
import { selectLocalMediaInstance, selectLocalMediaStarted } from "./localMedia-old";

/**
 * Reducer
 */

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
        connectionStatusChanged: (state, action: PayloadAction<ConnectionStatus>) => {
            return {
                ...state,
                status: action.payload,
            };
        },
    },
    extraReducers: (builder) => {
        builder.addCase(signalEvents.roomJoined, (state) => {
            //TODO: Handle error
            return {
                ...state,
                status: "connected",
            };
        });
    },
});

/**
 * Action creators
 */

const { connectionStatusChanged } = roomConnectionSlice.actions;

export const doConnectRoom = createAppThunk(() => (dispatch, getState) => {
    const state = getState();
    const socket = selectSignalConnectionRaw(state).socket;
    const roomName = selectAppRoomName(state);
    const roomKey = selectAppRoomKey(state);
    const displayName = selectAppDisplayName(state);
    const sdkVersion = selectAppSdkVersion(state);
    const organizationId = selectOrganizationId(state);
    const localMedia = selectLocalMediaInstance(state);

    socket?.emit("join_room", {
        avatarUrl: null,
        config: {
            isAudioEnabled: localMedia?.isMicrophoneEnabled() || false,
            isVideoEnabled: localMedia?.isCameraEnabled() || false,
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

    dispatch(connectionStatusChanged("connecting"));
});

/**
 * Selectors
 */

export const selectRoomConnectionRaw = (state: RootState) => state.roomConnection;
export const selectRoomConnectionStatus = (state: RootState) => state.roomConnection.status;

/**
 * Reactors
 */

createReactor(
    [selectOrganizationId, selectRoomConnectionStatus, selectSignalConnectionRaw, selectLocalMediaStarted],
    ({ dispatch }, hasOrganizationIdFetched, roomConnectionStatus, signalIdentified, localMediaStarted) => {
        if (
            localMediaStarted &&
            signalIdentified &&
            hasOrganizationIdFetched &&
            roomConnectionStatus === "initializing"
        ) {
            dispatch(doConnectRoom());
        }
    }
);
