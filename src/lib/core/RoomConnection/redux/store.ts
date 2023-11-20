import {
    AsyncThunk,
    AsyncThunkPayloadCreator,
    PreloadedState,
    combineReducers,
    configureStore,
    createAsyncThunk,
} from "@reduxjs/toolkit";
import { listenerMiddleware } from "./listenerMiddleware";
import { createServices } from "../../../services";

import { appSlice } from "./slices/app";
import { chatSlice } from "./slices/chat";
import { cloudRecordingSlice } from "./slices/cloudRecording";
import { deviceCredentialsSlice } from "./slices/deviceCredentials";
import { localParticipantSlice } from "./slices/localParticipant";
import { organizationSlice } from "./slices/organization";
import { roomSlice } from "./slices/room";
import { roomConnectionSlice } from "./slices/roomConnection";
import { signalConnectionSlice } from "./slices/signalConnection";
import { rtcConnectionSlice } from "./slices/rtcConnection";
import { streamingSlice } from "./slices/streaming";

export const rootReducer = combineReducers({
    app: appSlice.reducer,
    chat: chatSlice.reducer,
    cloudRecording: cloudRecordingSlice.reducer,
    deviceCredentials: deviceCredentialsSlice.reducer,
    localParticipant: localParticipantSlice.reducer,
    organization: organizationSlice.reducer,
    room: roomSlice.reducer,
    roomConnection: roomConnectionSlice.reducer,
    rtcConnection: rtcConnectionSlice.reducer,
    signalConnection: signalConnectionSlice.reducer,
    streaming: streamingSlice.reducer,
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
