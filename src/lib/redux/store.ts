import { PreloadedState, combineReducers, configureStore } from "@reduxjs/toolkit";
import { listenerMiddleware } from "./listenerMiddleware";
import { signalConnectionSlice } from "./slices/signalConnection";
import { deviceCredentialsSlice } from "./slices/deviceCredentials";
import { appSlice } from "./slices/app";
import { createServices } from "../Services";

export const rootReducer = combineReducers({
    app: appSlice.reducer,
    deviceCredentials: deviceCredentialsSlice.reducer,
    signalConnection: signalConnectionSlice.reducer,
});

export const create = ({
    preloadedState,
    injectServices,
}: {
    preloadedState?: PreloadedState<RootState>;
    injectServices: ReturnType<typeof createServices>;
}) => {
    return configureStore({
        reducer: {
            app: appSlice.reducer,
            deviceCredentials: deviceCredentialsSlice.reducer,
            signalConnection: signalConnectionSlice.reducer,
        },
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
export type AppDispatch = ReturnType<typeof create>["dispatch"];

// export const createAppAsyncThunk = createAsyncThunk.withTypes<{
//     state: RootState;
//     dispatch: AppDispatch;
//     extra: ReturnType<typeof createServices>;
// }>();
