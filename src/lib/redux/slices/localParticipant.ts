import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState, createAppAsyncThunk } from "../store";
import { LocalParticipant } from "~/lib/react";
import { selectSignalConnectionRaw } from "./signalConnection";
import { selectAppLocalMedia } from "./app";
import { selectRtcConnectionRaw } from "./rtcConnection";
import { doAddScreenshare, doRemoveScreenshare } from "./room";

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
    "signalConnection/doSignalEnableAudio",
    async (payload: { enabled: boolean }, { getState }) => {
        const state = getState();
        const socket = selectSignalConnectionRaw(state).socket;

        socket?.emit("enable_audio", { enabled: payload.enabled });

        return payload.enabled;
    }
);

export const doEnableVideo = createAppAsyncThunk(
    "signalConnection/doSignalEnableVideo",
    async (payload: { enabled: boolean }, { getState }) => {
        const state = getState();
        const socket = selectSignalConnectionRaw(state).socket;

        socket?.emit("enable_video", { enabled: payload.enabled });

        return payload.enabled;
    }
);

export const doStartScreenshare = createAppAsyncThunk(
    "signalConnection/doStartScreenshare",
    async (payload, { dispatch, getState }) => {
        const state = getState();
        const rtcManager = selectRtcConnectionRaw(state).rtcManager;
        const localMedia = selectAppLocalMedia(state);
        const selfId = selectSelfId(state);

        const screenshareStream = localMedia?.screenshareStream || (await localMedia?.startScreenshare());

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

            dispatch(
                doAddScreenshare({
                    participantId: selfId || "",
                    id: screenshareStream.id,
                    hasAudioTrack: false,
                    stream: screenshareStream,
                    isLocal: true,
                })
            );
        }
    }
);

export const doStopScreenshare = createAppAsyncThunk(
    "signalConnection/doStopScreenshare",
    async (payload, { dispatch, getState }) => {
        const state = getState();
        const rtcManager = selectRtcConnectionRaw(state).rtcManager;
        const localMedia = selectAppLocalMedia(state);

        const screenshareStream = localMedia?.screenshareStream;

        if (screenshareStream && localMedia.screenshareStream) {
            rtcManager?.removeStream(localMedia.screenshareStream.id, localMedia.screenshareStream, null);
            localMedia.stopScreenshare();
            dispatch(doRemoveScreenshare(screenshareStream.id));
        }
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
