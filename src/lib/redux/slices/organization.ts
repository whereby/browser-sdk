import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import Organization from "../../api/models/Organization";
import { createServices } from "~/lib/services";
import { startAppListening } from "../listenerMiddleware";
import { selectAppWantsToJoin } from "./app";

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

export const doOrganizationFetch = createAsyncThunk<
    Organization | null | undefined,
    undefined,
    {
        extra: ReturnType<typeof createServices>;
    }
>("organization/doOrganizationFetch", async (payload, { extra }) => {
    try {
        const organization = await extra.organizationServiceCache.fetchOrganization();

        if (!organization) {
            throw new Error("Invalid room url");
        }

        return organization;
    } catch (error) {
        console.error(error);
    }
});

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
            return {
                ...state,
                isFetching: false,
                data: action.payload,
            };
        });
        builder.addCase(doOrganizationFetch.rejected, (state, action) => {
            return {
                ...state,
                isFetching: false,
                error: action.error,
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

        if (wantsToJoin && !organization.data && !organization.isFetching && !organization.error) {
            return true;
        }
        return false;
    },
    effect: (action, { dispatch }) => {
        dispatch(doOrganizationFetch());
    },
});
