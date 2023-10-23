import { createAsyncThunk, AsyncThunkPayloadCreator, AsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "./reducer";
import { Store } from "./store";

export function createAppAsyncThunk<ReturnType, ArgType = undefined>(
    typePrefix: string,
    payloadCreator: AsyncThunkPayloadCreator<ReturnType, ArgType, ThunkConfig>
): AsyncThunk<ReturnType, ArgType, ThunkConfig> {
    return createAsyncThunk<ReturnType, ArgType, ThunkConfig>(typePrefix, payloadCreator);
}

export type AppDispatch = Store["dispatch"];
export type ThunkConfig = {
    state: RootState;
    dispatch: AppDispatch;
};
