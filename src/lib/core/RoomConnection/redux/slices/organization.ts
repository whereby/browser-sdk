import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { createAppAsyncThunk } from "../asyncThunk";
import Organization from "../../../../api/models/Organization";
import { createReactor } from "../listenerMiddleware";
import { selectAppWantsToJoin } from "./app";
import { selectDeviceCredentialsRaw } from "./deviceCredentials";

/**
 * Reducer
 */

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

/**
 * Action creators
 */

export const doOrganizationFetch = createAppAsyncThunk("organization/doOrganizationFetch", async (_, { extra }) => {
    try {
        const organization = await extra.services.organizationServiceCache.fetchOrganization();

        if (!organization) {
            throw new Error("Invalid room url");
        }

        return organization;
    } catch (error) {
        console.error(error);
    }
});

/**
 * Selectors
 */

export const selectOrganizationRaw = (state: RootState) => state.organization;
export const selectOrganizationId = (state: RootState) => state.organization.data?.organizationId;

/**
 * Reducers
 */

createReactor(
    [selectAppWantsToJoin, selectOrganizationRaw, selectDeviceCredentialsRaw],
    (_, { dispatch, getState }) => {
        const wantsToJoin = selectAppWantsToJoin(getState());
        const organization = selectOrganizationRaw(getState());
        const deviceCredentials = selectDeviceCredentialsRaw(getState());

        if (
            wantsToJoin &&
            !organization.data &&
            !organization.isFetching &&
            !organization.error &&
            !deviceCredentials.isFetching
        ) {
            dispatch(doOrganizationFetch());
        }
    }
);
