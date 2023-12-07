import { PayloadAction, createSelector, createSlice } from "@reduxjs/toolkit";

import { createReactor, startAppListening } from "../listenerMiddleware";
import { RootState } from "../store";
import { createAppThunk } from "../thunk";
import {
    selectAppDisplayName,
    selectAppExternalId,
    selectAppRoomKey,
    selectAppRoomName,
    selectAppSdkVersion,
    setRoomKey,
} from "./app";

import { selectOrganizationId } from "./organization";
import { signalEvents } from "./signalConnection/actions";
import { selectSignalConnectionDeviceIdentified, selectSignalConnectionRaw } from "./signalConnection";
import { selectIsCameraEnabled, selectIsMicrophoneEnabled, selectLocalMediaStatus } from "./localMedia";
import { selectSelfId } from "./localParticipant";

export type ConnectionStatus =
    | "initializing"
    | "connecting"
    | "connected"
    | "room_locked"
    | "knocking"
    | "disconnecting"
    | "disconnected"
    | "knock_rejected";
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
        builder.addCase(signalEvents.roomJoined, (state, action) => {
            //TODO: Handle error
            const { error, isLocked } = action.payload;

            if (error === "room_locked" && isLocked) {
                return {
                    ...state,
                    status: "room_locked",
                };
            }

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

export const doKnockRoom = createAppThunk(() => (dispatch, getState) => {
    const state = getState();
    const socket = selectSignalConnectionRaw(state).socket;
    const roomName = selectAppRoomName(state);
    const roomKey = selectAppRoomKey(state);
    const displayName = selectAppDisplayName(state);
    const sdkVersion = selectAppSdkVersion(state);
    const externalId = selectAppExternalId(state);
    const organizationId = selectOrganizationId(state);

    socket?.emit("knock_room", {
        avatarUrl: null,
        config: {
            isAudioEnabled: true,
            isVideoEnabled: true,
        },
        deviceCapabilities: { canScreenshare: true },
        displayName,
        isCoLocated: false,
        isDevicePermissionDenied: false,
        kickFromOtherRooms: false,
        organizationId,
        roomKey,
        roomName,
        selfId: "",
        userAgent: `browser-sdk:${sdkVersion || "unknown"}`,
        externalId,
    });

    dispatch(connectionStatusChanged("knocking"));
});

export const doConnectRoom = createAppThunk(() => (dispatch, getState) => {
    const state = getState();
    const socket = selectSignalConnectionRaw(state).socket;
    const roomName = selectAppRoomName(state);
    const roomKey = selectAppRoomKey(state);
    const displayName = selectAppDisplayName(state);
    const sdkVersion = selectAppSdkVersion(state);
    const externalId = selectAppExternalId(state);
    const organizationId = selectOrganizationId(state);
    const isCameraEnabled = selectIsCameraEnabled(getState());
    const isMicrophoneEnabled = selectIsMicrophoneEnabled(getState());

    socket?.emit("join_room", {
        avatarUrl: null,
        config: {
            isAudioEnabled: isMicrophoneEnabled,
            isVideoEnabled: isCameraEnabled,
        },
        deviceCapabilities: { canScreenshare: true },
        displayName,
        isCoLocated: false,
        isDevicePermissionDenied: false,
        kickFromOtherRooms: false,
        organizationId,
        roomKey,
        roomName,
        selfId: "",
        userAgent: `browser-sdk:${sdkVersion || "unknown"}`,
        externalId,
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

export const selectShouldConnectRoom = createSelector(
    [selectOrganizationId, selectRoomConnectionStatus, selectSignalConnectionDeviceIdentified, selectLocalMediaStatus],
    (hasOrganizationIdFetched, roomConnectionStatus, signalConnectionDeviceIdentified, localMediaStatus) => {
        if (
            localMediaStatus === "started" &&
            signalConnectionDeviceIdentified &&
            !!hasOrganizationIdFetched &&
            roomConnectionStatus === "initializing"
        ) {
            return true;
        }
        return false;
    }
);

createReactor([selectShouldConnectRoom], ({ dispatch }, shouldConnectRoom) => {
    if (shouldConnectRoom) {
        dispatch(doConnectRoom());
    }
});

startAppListening({
    actionCreator: signalEvents.knockHandled,
    effect: ({ payload }, { dispatch, getState }) => {
        const { clientId, resolution } = payload;

        const state = getState();
        const selfId = selectSelfId(state);

        if (clientId !== selfId) {
            return;
        }

        if (resolution === "accepted") {
            dispatch(setRoomKey(payload.metadata.roomKey));
            dispatch(doConnectRoom());
        } else if (resolution === "rejected") {
            dispatch(connectionStatusChanged("knock_rejected"));
        }
    },
});
