import { PreloadedState, combineReducers, configureStore } from "@reduxjs/toolkit";
import { listenerMiddleware } from "./listenerMiddleware";
import { createServices } from "../../../services";

import { appSlice } from "./slices/app";
import { chatSlice } from "./slices/chat";
import { cloudRecordingSlice } from "./slices/cloudRecording";
import { deviceCredentialsSlice } from "./slices/deviceCredentials";
import { localMediaSlice } from "./slices/localMedia";
import { localParticipantSlice } from "./slices/localParticipant";
import { organizationSlice } from "./slices/organization";
import { remoteParticipantsSlice } from "./slices/remoteParticipants";
import { roomConnectionSlice } from "./slices/roomConnection";
import { signalConnectionSlice } from "./slices/signalConnection";
import { rtcConnectionSlice } from "./slices/rtcConnection";
import { streamingSlice } from "./slices/streaming";
import { waitingParticipantsSlice } from "./slices/waitingParticipants";

export const rootReducer = combineReducers({
    app: appSlice.reducer,
    chat: chatSlice.reducer,
    cloudRecording: cloudRecordingSlice.reducer,
    deviceCredentials: deviceCredentialsSlice.reducer,
    localMedia: localMediaSlice.reducer,
    localParticipant: localParticipantSlice.reducer,
    organization: organizationSlice.reducer,
    remoteParticipants: remoteParticipantsSlice.reducer,
    roomConnection: roomConnectionSlice.reducer,
    rtcConnection: rtcConnectionSlice.reducer,
    signalConnection: signalConnectionSlice.reducer,
    streaming: streamingSlice.reducer,
    waitingParticipants: waitingParticipantsSlice.reducer,
});

export const createStore = ({
    preloadedState,
    injectServices,
}: {
    preloadedState?: PreloadedState<RootState>;
    injectServices: ReturnType<typeof createServices>;
}) => {
    return configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: {
                    extraArgument: { services: injectServices },
                },
                serializableCheck: false,
            }).prepend(listenerMiddleware.middleware),
        preloadedState,
    });
};

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ReturnType<typeof createStore>["dispatch"];
