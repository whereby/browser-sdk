import { createAsyncThunk, AsyncThunk, AsyncThunkPayloadCreator, ThunkAction, AnyAction } from "@reduxjs/toolkit";
import { RootState, AppDispatch } from "./store";
import { createServices } from "../../services";

export type ThunkConfig = {
    state: RootState;
    dispatch: AppDispatch;
    extra: { services: ReturnType<typeof createServices> };
};

export function createAppAsyncThunk<ReturnType, ArgType = undefined>(
    typePrefix: string,
    payloadCreator: AsyncThunkPayloadCreator<ReturnType, ArgType, ThunkConfig>
): AsyncThunk<ReturnType, ArgType, ThunkConfig> {
    return createAsyncThunk<ReturnType, ArgType, ThunkConfig>(typePrefix, payloadCreator);
}

export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>;

export function createAppThunk<A = void>(thunk: (args: A) => AppThunk) {
    return thunk;
}
