import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { listenerMiddleware } from "./listenerMiddleware";
import { createServices } from "../../services";

import { appSlice } from "./slices/app";
import { chatSlice } from "./slices/chat";
import { cloudRecordingSlice } from "./slices/cloudRecording";
import { deviceCredentialsSlice } from "./slices/deviceCredentials";
import { localMediaSlice } from "./slices/localMedia";
import { localParticipantSlice } from "./slices/localParticipant";
import { localScreenshareSlice } from "./slices/localScreenshare";
import { organizationSlice } from "./slices/organization";
import { remoteParticipantsSlice } from "./slices/remoteParticipants";
import { roomConnectionSlice } from "./slices/roomConnection";
import { signalConnectionSlice } from "./slices/signalConnection";
import { rtcAnalyticsSlice } from "./slices/rtcAnalytics";
import { rtcConnectionSlice } from "./slices/rtcConnection";
import { streamingSlice } from "./slices/streaming";
import { waitingParticipantsSlice } from "./slices/waitingParticipants";

const IS_DEV = process.env.REACT_APP_IS_DEV === "true" ?? false;

export const rootReducer = combineReducers({
    app: appSlice.reducer,
    chat: chatSlice.reducer,
    cloudRecording: cloudRecordingSlice.reducer,
    deviceCredentials: deviceCredentialsSlice.reducer,
    localMedia: localMediaSlice.reducer,
    localParticipant: localParticipantSlice.reducer,
    localScreenshare: localScreenshareSlice.reducer,
    organization: organizationSlice.reducer,
    remoteParticipants: remoteParticipantsSlice.reducer,
    roomConnection: roomConnectionSlice.reducer,
    rtcAnalytics: rtcAnalyticsSlice.reducer,
    rtcConnection: rtcConnectionSlice.reducer,
    signalConnection: signalConnectionSlice.reducer,
    streaming: streamingSlice.reducer,
    waitingParticipants: waitingParticipantsSlice.reducer,
});

export const createStore = ({
    preloadedState,
    injectServices,
}: {
    preloadedState?: Partial<RootState>;
    injectServices: ReturnType<typeof createServices>;
}) => {
    return configureStore({
        devTools: IS_DEV,
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

export type RootReducer = typeof rootReducer;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ReturnType<typeof createStore>["dispatch"];

export type Store = ReturnType<typeof createStore>;

export const observeStore = <T>(store: Store, select: (state: RootState) => T, onChange: (result: T) => void) => {
    let currentState: T;

    function handleChange() {
        const nextState = select(store.getState());
        if (nextState !== currentState) {
            currentState = nextState;
            onChange(currentState);
        }
    }

    const unsubscribe = store.subscribe(handleChange);
    handleChange();
    return unsubscribe;
};
