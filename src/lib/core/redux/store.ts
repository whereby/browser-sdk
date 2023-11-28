import { PreloadedState, combineReducers, configureStore } from "@reduxjs/toolkit";
import { listenerMiddleware } from "./listenerMiddleware";
import { createServices } from "../../services";

import { appSlice } from "../RoomConnection/redux/slices/app";
import { chatSlice } from "../RoomConnection/redux/slices/chat";
import { cloudRecordingSlice } from "../RoomConnection/redux/slices/cloudRecording";
import { deviceCredentialsSlice } from "../RoomConnection/redux/slices/deviceCredentials";
import { localMediaSlice } from "../LocalMedia/slices/localMedia";
//import { localMediaSlice } from "../RoomConnection/redux/slices/localMedia";
import { localParticipantSlice } from "../RoomConnection/redux/slices/localParticipant";
import { organizationSlice } from "../RoomConnection/redux/slices/organization";
import { remoteParticipantsSlice } from "../RoomConnection/redux/slices/remoteParticipants";
import { roomConnectionSlice } from "../RoomConnection/redux/slices/roomConnection";
import { signalConnectionSlice } from "../RoomConnection/redux/slices/signalConnection";
import { rtcConnectionSlice } from "../RoomConnection/redux/slices/rtcConnection";
import { streamingSlice } from "../RoomConnection/redux/slices/streaming";
import { waitingParticipantsSlice } from "../RoomConnection/redux/slices/waitingParticipants";

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
