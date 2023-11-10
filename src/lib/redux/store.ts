import {
    AsyncThunk,
    AsyncThunkPayloadCreator,
    PreloadedState,
    combineReducers,
    configureStore,
    createAsyncThunk,
} from "@reduxjs/toolkit";
import { listenerMiddleware } from "./listenerMiddleware";
import { createServices } from "../services";

import { appSlice } from "./slices/app";
import { chatSlice } from "./slices/chat";
import { deviceCredentialsSlice } from "./slices/deviceCredentials";
import { organizationSlice } from "./slices/organization";
import { roomSlice } from "./slices/room";
import { roomConnectionSlice } from "./slices/roomConnection";
import { signalConnectionSlice } from "./slices/signalConnection";
import { rtcConnectionSlice } from "./slices/rtcConnection";
import { localMediaSlice } from "./slices/localMedia";

export const rootReducer = combineReducers({
    app: appSlice.reducer,
    chat: chatSlice.reducer,
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
    injectServices?: ReturnType<typeof createServices>;
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
export type ThunkConfig = {
    state: RootState;
    dispatch: AppDispatch;
    extra: { services?: ReturnType<typeof createServices> };
};

export function createAppAsyncThunk<ReturnType, ArgType = undefined>(
    typePrefix: string,
    payloadCreator: AsyncThunkPayloadCreator<ReturnType, ArgType, ThunkConfig>
): AsyncThunk<ReturnType, ArgType, ThunkConfig> {
    return createAsyncThunk<ReturnType, ArgType, ThunkConfig>(typePrefix, payloadCreator);
}
