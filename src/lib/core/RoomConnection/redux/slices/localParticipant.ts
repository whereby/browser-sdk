import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../../../redux/store";
import { createAppAsyncThunk } from "../../../redux/thunk";
import { LocalParticipant } from "~/lib/react";
import { selectSignalConnectionRaw } from "./signalConnection";
import { selectRtcConnectionRaw } from "./rtcConnection";

import { doAppJoin } from "./app";
import { selectScreenshareStream } from "../../../LocalMedia/slices/localMedia";
// import { doAddScreenshare, doRemoveScreenshare } from "./remoteParticipants";

export interface LocalParticipantState extends LocalParticipant {
    isScreenSharing: boolean;
}

const initialState: LocalParticipantState = {
    displayName: "",
    id: "",
    isAudioEnabled: true,
    isVideoEnabled: true,
    isLocalParticipant: true,
    stream: undefined,
    isScreenSharing: false,
};

export const doEnableAudio = createAppAsyncThunk(
    "localParticipant/doEnableAudio",
    async (payload: { enabled: boolean }, { getState }) => {
        const state = getState();
        const socket = selectSignalConnectionRaw(state).socket;

        socket?.emit("enable_audio", { enabled: payload.enabled });

        return payload.enabled;
    }
);

export const doEnableVideo = createAppAsyncThunk(
    "localParticipant/doEnableVideo",
    async (payload: { enabled: boolean }, { getState }) => {
        const state = getState();
        const socket = selectSignalConnectionRaw(state).socket;

        socket?.emit("enable_video", { enabled: payload.enabled });

        return payload.enabled;
    }
);

export const doSetDisplayName = createAppAsyncThunk(
    "localParticipant/doSetDisplayName",
    async (payload: { displayName: string }, { getState }) => {
        const state = getState();
        const socket = selectSignalConnectionRaw(state).socket;

        socket?.emit("send_client_metadata", {
            type: "UserData",
            payload,
        });

        return payload.displayName;
    }
);

export const doStartScreenshare = createAppAsyncThunk(
    "localParticipant/doStartScreenshare",
    async (payload, { dispatch, getState }) => {
        const state = getState();
        const rtcManager = selectRtcConnectionRaw(state).rtcManager;
        const selfId = selectSelfId(state);
        const screenshareStream = selectScreenshareStream(state);

        //const screenshareStream = localMedia?.screenshareStream || (await localMedia?.startScreenshare());

        if (screenshareStream) {
            const onEnded = () => {
                dispatch(doStopScreenshare());
            };

            if ("oninactive" in screenshareStream) {
                // Chrome
                screenshareStream.addEventListener("inactive", onEnded);
            } else {
                // FF
                screenshareStream.getVideoTracks()[0]?.addEventListener("ended", onEnded);
            }

            rtcManager?.addNewStream(screenshareStream.id, screenshareStream, false, true);

            // dispatch(
            //     doAddScreenshare({
            //         participantId: selfId || "",
            //         id: screenshareStream.id,
            //         hasAudioTrack: false,
            //         stream: screenshareStream,
            //         isLocal: true,
            //     })
            // );
        }
    }
);

export const doStopScreenshare = createAppAsyncThunk(
    "localParticipant/doStopScreenshare",
    async (payload, { dispatch, getState }) => {
        const state = getState();
        const rtcManager = selectRtcConnectionRaw(state).rtcManager;

        //const screenshareStream = localMedia?.screenshareStream;

        /*if (screenshareStream && localMedia.screenshareStream) {
            rtcManager?.removeStream(localMedia.screenshareStream.id, localMedia.screenshareStream, null);
            localMedia.stopScreenshare();
            // dispatch(doRemoveScreenshare(screenshareStream.id));
        }*/
    }
);

export const localParticipantSlice = createSlice({
    name: "localParticipant",
    initialState,
    reducers: {
        doSetLocalParticipant: (state, action: PayloadAction<LocalParticipant>) => {
            return {
                ...state,
                ...action.payload,
            };
        },
    },
    extraReducers: (builder) => {
        builder.addCase(doAppJoin, (state, action) => {
            return {
                ...state,
                displayName: action.payload.displayName,
            };
        });

        builder.addCase(doEnableAudio.fulfilled, (state, action) => {
            return {
                ...state,
                isAudioEnabled: action.payload,
            };
        });
        builder.addCase(doEnableVideo.fulfilled, (state, action) => {
            return {
                ...state,
                isVideoEnabled: action.payload,
            };
        });
        builder.addCase(doSetDisplayName.fulfilled, (state, action) => {
            return {
                ...state,
                displayName: action.payload,
            };
        });
        builder.addCase(doStartScreenshare.fulfilled, (state) => {
            return {
                ...state,
                isScreenSharing: true,
            };
        });
        builder.addCase(doStopScreenshare.fulfilled, (state) => {
            return {
                ...state,
                isScreenSharing: false,
            };
        });
    },
});

export const { doSetLocalParticipant } = localParticipantSlice.actions;

export const selectLocalParticipantRaw = (state: RootState) => state.localParticipant;
export const selectSelfId = (state: RootState) => state.localParticipant.id;
