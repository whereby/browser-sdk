import { createSlice } from "@reduxjs/toolkit";
import { RootState, createAppAsyncThunk } from "../store";
import Organization from "../../api/models/Organization";
import { startAppListening } from "../listenerMiddleware";
import { selectAppWantsToJoin } from "./app";
import { selectDeviceCredentialsRaw } from "./deviceCredentials";

export interface OrganizationState {
    data: Organization | null | undefined;
    isFetching: boolean;
    error: unknown;
}

const initialState: OrganizationState = {
    data: null,
    isFetching: false,
    error: null,
};

export const doOrganizationFetch = createAppAsyncThunk(
    "organization/doOrganizationFetch",
    async (payload, { extra }) => {
        try {
            const organization = await extra.services?.organizationServiceCache.fetchOrganization();

            if (!organization) {
                throw new Error("Invalid room url");
            }

            return organization;
        } catch (error) {
            console.error(error);
        }
    }
);

export const organizationSlice = createSlice({
    initialState,
    name: "organization",
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(doOrganizationFetch.pending, (state) => {
            return {
                ...state,
                isFetching: true,
            };
        });
        builder.addCase(doOrganizationFetch.fulfilled, (state, action) => {
            if (!action.payload) return { ...state, isFetching: true };
            return {
                ...state,
                isFetching: false,
                data: action.payload,
            };
        });
        builder.addCase(doOrganizationFetch.rejected, (state) => {
            return {
                ...state,
                isFetching: false,
                error: true,
            };
        });
    },
});

export const selectOrganizationRaw = (state: RootState) => state.organization;
export const selectOrganizationId = (state: RootState) => state.organization.data?.organizationId;

startAppListening({
    predicate: (action, currentState) => {
        const wantsToJoin = selectAppWantsToJoin(currentState);
        const organization = selectOrganizationRaw(currentState);
        const deviceCredentials = selectDeviceCredentialsRaw(currentState);

        if (
            wantsToJoin &&
            !organization.data &&
            !organization.isFetching &&
            !organization.error &&
            !deviceCredentials.isFetching
        ) {
            return true;
        }
        return false;
    },
    effect: (action, { dispatch }) => {
        dispatch(doOrganizationFetch());
    },
});
