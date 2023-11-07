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
}: {
    preloadedState?: PreloadedState<RootState>;
    injectServices: ReturnType<typeof createServices>;
}) => {
    return configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: {
                    extraArgument: injectServices,
                },
                serializableCheck: false,
            }).prepend(listenerMiddleware.middleware),
        preloadedState,
    });
};

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ReturnType<typeof createStore>["dispatch"];

// export const createAppAsyncThunk = createAsyncThunk.withTypes<{
//     state: RootState;
//     dispatch: AppDispatch;
//     extra: ReturnType<typeof createServices>;
// }>();
