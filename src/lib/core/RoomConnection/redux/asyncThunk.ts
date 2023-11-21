import { createAsyncThunk, AsyncThunk, AsyncThunkPayloadCreator } from "@reduxjs/toolkit";
import { RootState, AppDispatch } from "./store";
import { createServices } from "../../../services";

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
