import { PreloadedState, combineReducers, configureStore } from "@reduxjs/toolkit";
import { listenerMiddleware } from "./listenerMiddleware";
import { createServices } from "../services";

import { appSlice } from "./slices/app";
import { deviceCredentialsSlice } from "./slices/deviceCredentials";
import { organizationSlice } from "./slices/organization";
import { roomSlice } from "./slices/room";
import { roomConnectionSlice } from "./slices/roomConnection";
import { signalConnectionSlice } from "./slices/signalConnection";
import { rtcConnectionSlice } from "./slices/rtcConnection";
import { localMediaSlice } from "./slices/localMedia";

export const rootReducer = combineReducers({
    app: appSlice.reducer,
    deviceCredentials: deviceCredentialsSlice.reducer,
    localMedia: localMediaSlice.reducer,
    organization: organizationSlice.reducer,
    room: roomSlice.reducer,
    roomConnection: roomConnectionSlice.reducer,
    rtcConnection: rtcConnectionSlice.reducer,
    signalConnection: signalConnectionSlice.reducer,
});

export const createStore = ({
    preloadedState,
    injectServices,
    dispatchEvent,
}: {
    preloadedState?: PreloadedState<RootState>;
    injectServices: ReturnType<typeof createServices>;
    dispatchEvent: (event: CustomEvent) => void;
}) => {
    return configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: {
                    extraArgument: { services: injectServices, dispatchEvent },
                },
                serializableCheck: false,
            }).prepend(listenerMiddleware.middleware),
        preloadedState,
    });
};

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ReturnType<typeof createStore>["dispatch"];
export type ThunkConfig = {
    state: RootState;
    dispatch: AppDispatch;
    extra: { services: ReturnType<typeof createServices>; dispatchEvent: (event: CustomEvent) => void };
};
