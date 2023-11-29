import { createSelector } from "@reduxjs/toolkit";
import { RoomConnectionState } from "./types";

import { selectChatMessages } from "../../core/redux/slices/chat";
import { selectCloudRecordingRaw } from "../../core/redux/slices/cloudRecording";
import { selectRemoteParticipants } from "../../core/redux/slices/remoteParticipants";
import { selectRoomConnectionStatus } from "../../core/redux/slices/roomConnection";
import { selectWaitingParticipants } from "../../core/redux/slices/waitingParticipants";
import { selectLocalParticipantRaw } from "../../core/redux/slices/localParticipant";
import { selectLocalMediaStream } from "../../core/redux/slices/localMedia";
import { selectStreamingRaw } from "../../core/redux/slices/streaming";

export const selectRoomConnectionState = createSelector(
    selectChatMessages,
    selectCloudRecordingRaw,
    selectLocalParticipantRaw,
    selectLocalMediaStream,
    selectRemoteParticipants,
    selectRoomConnectionStatus,
    selectStreamingRaw,
    selectWaitingParticipants,
    (
        chatMessages,
        cloudRecording,
        localParticipant,
        localMediaStream,
        remoteParticipants,
        connectionStatus,
        streaming,
        waitingParticipants
    ) => {
        const state: RoomConnectionState = {
            chatMessages,
            cloudRecording: cloudRecording.isRecording ? { status: "recording" } : undefined,
            localScreenshareStatus: localParticipant.isScreenSharing ? "active" : undefined,
            localParticipant: { ...localParticipant, stream: localMediaStream },
            remoteParticipants,
            connectionStatus,
            liveStream: streaming.isStreaming
                ? {
                      status: "streaming",
                      startedAt: streaming.startedAt,
                  }
                : undefined,
            waitingParticipants,
        };

        return state;
    }
);
