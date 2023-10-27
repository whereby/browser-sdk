import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { startAppListening } from "../listenerMiddleware";
import { selectAppWantsToJoin } from "./app";
import { Credentials } from "~/lib/api";
import { createServices } from "~/lib/services";

export interface DeviceCredentialsState {
    isFetching: boolean;
    data?: Credentials | null;
}

const initialState: DeviceCredentialsState = {
    isFetching: false,
    data: null,
};

export const doGetDeviceCredentials = createAsyncThunk<
    Credentials | null | undefined,
    undefined,
    {
        extra: ReturnType<typeof createServices>;
    }
>("deviceCredentials/doGetDeviceCredentials", async (payload, { extra }) => {
    try {
        const deviceCredentials = await extra.credentialsService.getCredentials();

        return deviceCredentials;
    } catch (error) {
        console.error(error);
    }
});

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

startAppListening({
    predicate: (action, currentState, previousState) => {
        const wantsToJoin = selectAppWantsToJoin(currentState);
        const deviceCredentialsRaw = selectDeviceCredentialsRaw(currentState);

        if (wantsToJoin && !deviceCredentialsRaw.data && !deviceCredentialsRaw.isFetching) {
            return true;
        }
        return false;
    },
    effect: (action, listenerApi) => {
        listenerApi.dispatch(doGetDeviceCredentials());
    },
});
