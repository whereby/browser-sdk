import { combineReducers } from "@reduxjs/toolkit";
import { localMediaSlice } from "./slices/localMedia";

export const rootReducer = combineReducers({
    localMedia: localMediaSlice.reducer,
});
export type RootReducer = typeof rootReducer;
export type RootState = ReturnType<RootReducer>;
