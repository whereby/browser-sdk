import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState, ThunkConfig } from "../store";
import { RoomJoinedEvent } from "@whereby/jslib-media/src/utils/ServerSocket";
import { doRoomConnectionStatusChanged } from "./roomConnection";
import { RemoteParticipant, WaitingParticipant, LocalParticipant } from "../../RoomParticipant";
import { doRtcManagerDestroyed, selectRtcConnectionRaw } from "./rtcConnection";
import { doSignalDisconnect, selectSignalConnectionRaw } from "./signalConnection";

const NON_PERSON_ROLES = ["recorder", "streamer"];

export interface RoomState {
    remoteParticipants: RemoteParticipant[];
    localParticipant?: LocalParticipant;
    selfId?: string;
    waitingParticipants: WaitingParticipant[];
}

const initialState: RoomState = {
    remoteParticipants: [],
    waitingParticipants: [],
};

export const doRoomJoined = createAsyncThunk<
    | {
          localParticipant: LocalParticipant;
          remoteParticipants: RemoteParticipant[];
          waitingParticipants: WaitingParticipant[];
      }
    | undefined,
    RoomJoinedEvent,
    ThunkConfig
>("room/doRoomJoined", async (payload, { dispatch }) => {
    const { error, isLocked, room, selfId } = payload;

    if (error === "room_locked" && isLocked) {
        dispatch(doRoomConnectionStatusChanged({ status: "room_locked" }));
    }

    if (room) {
        const { clients, knockers } = room;

        const localClient = clients.find((c) => c.id === selfId);
        if (!localClient) throw new Error("Missing local client");

        // const recorderClient = clients.find((c) => c.role.roleName === "recorder");
        // if (recorderClient) {
        //     this._handleCloudRecordingStarted({ client: recorderClient });
        // }

        // const streamerClient = clients.find((c) => c.role.roleName === "streamer");
        // if (streamerClient) {
        //     this._handleStreamingStarted();
        // }

        const remoteParticipants = clients
            .filter((c) => c.id !== selfId)
            .filter((c) => !NON_PERSON_ROLES.includes(c.role.roleName))
            .map((c) => new RemoteParticipant({ ...c, newJoiner: false }));

        dispatch(doRoomConnectionStatusChanged({ status: "connected" }));

        return {
            localParticipant: new LocalParticipant(localClient),
            remoteParticipants,
            waitingParticipants: knockers.map((knocker) => ({
                id: knocker.clientId,
                displayName: knocker.displayName,
            })),
        };
    }
});

export const doRoomLeft = createAsyncThunk<void, undefined, ThunkConfig>(
    "room/doRoomLeft",
    async (payload, { dispatch, getState }) => {
        dispatch(doRoomConnectionStatusChanged({ status: "disconnecting" }));
        const state = getState();
        const rtcManager = selectRtcConnectionRaw(state).rtcManager;
        const socket = selectSignalConnectionRaw(state).socket;

        rtcManager?.disconnectAll();
        dispatch(doRtcManagerDestroyed());

        if (socket) {
            dispatch(doRoomConnectionStatusChanged({ status: "disconnected" }));
            dispatch(doSignalDisconnect());
        }
    }
);

export const roomSlice = createSlice({
    name: "room",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(doRoomJoined.fulfilled, (state, action) => {
            if (!action.payload) return state;

            return {
                ...state,
                localParticipant: action.payload.localParticipant,
                remoteParticipants: action.payload.remoteParticipants,
                waitingParticipants: action.payload.waitingParticipants,
            };
        });
    },
});

export const selectRoomRaw = (state: RootState) => state.room;
export const selectLocalParticipant = (state: RootState) => state.room.localParticipant;
export const selectRemoteParticipants = (state: RootState) => state.room.remoteParticipants;
export const selectWaitingParticipants = (state: RootState) => state.room.waitingParticipants;
