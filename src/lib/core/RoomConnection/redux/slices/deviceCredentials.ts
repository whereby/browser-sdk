import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { createAppAsyncThunk } from "../asyncThunk";
import { createReactor } from "../listenerMiddleware";
import { selectAppWantsToJoin } from "./app";
import { Credentials } from "~/lib/api";

export interface DeviceCredentialsState {
    isFetching: boolean;
    data?: Credentials | null;
}

const initialState: DeviceCredentialsState = {
    isFetching: false,
    data: null,
};

export const doGetDeviceCredentials = createAppAsyncThunk(
    "deviceCredentials/doGetDeviceCredentials",
    async (payload, { extra }) => {
        try {
            const deviceCredentials = await extra.services.credentialsService.getCredentials();

            return deviceCredentials;
        } catch (error) {
            console.error(error);
        }
    }
);

export const deviceCredentialsSlice = createSlice({
    name: "deviceCredentials",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(doGetDeviceCredentials.pending, (state) => {
            return {
                ...state,
                isFetching: true,
            };
        });
        builder.addCase(doGetDeviceCredentials.fulfilled, (state, action) => {
            return {
                ...state,
                isFetching: false,
                data: action.payload,
            };
        });
        builder.addCase(doGetDeviceCredentials.rejected, (state) => {
            // not handled in the pwa either.
            return {
                ...state,
                isFetching: true,
            };
        });
    },
});

export const selectDeviceCredentialsRaw = (state: RootState) => state.deviceCredentials;
export const selectHasFetchedDeviceCredentials = (state: RootState) => !!state.deviceCredentials.data?.credentials;

export const shouldFetchDeviceCredentials = (
    wantsToJoin: boolean,
    isFetching: boolean,
    deviceCredentialsData?: Credentials | null
) => {
    if (wantsToJoin && !deviceCredentialsData && !isFetching) {
        return true;
    }
    return false;
};

createReactor((_, { dispatch, getState }) => {
    const wantsToJoin = selectAppWantsToJoin(getState());
    const deviceCredentials = selectDeviceCredentialsRaw(getState());

    if (shouldFetchDeviceCredentials(wantsToJoin, deviceCredentials.isFetching, deviceCredentials.data)) {
        dispatch(doGetDeviceCredentials());
    }
});