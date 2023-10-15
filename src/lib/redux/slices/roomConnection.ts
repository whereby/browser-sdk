import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import {
    ApiClient,
    Credentials,
    CredentialsService,
    OrganizationApiClient,
    OrganizationService,
    OrganizationServiceCache,
    RoomService,
} from "../../api";
import ServerSocket, {
    ChatMessage as SignalChatMessage,
    ClientLeftEvent,
    ClientMetadataReceivedEvent,
    KnockerLeftEvent,
    KnockAcceptedEvent,
    KnockRejectedEvent,
    NewClientEvent,
    RoomJoinedEvent as SignalRoomJoinedEvent,
    RoomKnockedEvent as SignalRoomKnockedEvent,
    SignalClient,
    SocketManager,
    ScreenshareStartedEvent as SignalScreenshareStartedEvent,
    ScreenshareStoppedEvent as SignalScreenshareStoppedEvent,
} from "@whereby/jslib-media/src/utils/ServerSocket";
import Organization from "../../api/models/Organization";
import { createServices } from "~/lib/Services";

export type InteralRoomConnectionStatus = "" | "joining" | "joined" | "leaving" | "reconnect" | "queued" | "error";

export interface RoomConnectionState {
    localMedia: {
        isStarted: boolean;
        isStarting: boolean;
    };
    organization: {
        data: Organization | null | undefined;
        isFetching: boolean;
        error: unknown;
    };
    roomConnection: {
        status: InteralRoomConnectionStatus;
        error: unknown;
    };
}

const initialState: RoomConnectionState = {
    localMedia: {
        isStarted: false,
        isStarting: false,
    },
    organization: {
        data: null,
        isFetching: false,
        error: null,
    },
    roomConnection: {
        status: "",
        error: null,
    },
};

export const doOrganizationFetch = createAsyncThunk<
    Organization | null | undefined,
    undefined,
    {
        extra: ReturnType<typeof createServices>;
    }
>("roomConnection/doOrganizationFetch", async (payload, { extra }) => {
    try {
        const organization = await extra.organizationServiceCache.fetchOrganization();
        return organization;
    } catch (error) {
        console.error(error);
    }
});

export const roomConnectionSlice = createSlice({
    initialState,
    name: "roomConnection",
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(doOrganizationFetch.pending, (state) => {
            return {
                ...state,
                organization: {
                    ...state.organization,
                    isFetching: true,
                },
            };
        });
        builder.addCase(doOrganizationFetch.fulfilled, (state, action) => {
            return {
                ...state,
                organization: {
                    ...state.organization,
                    isFetching: false,
                    data: action.payload,
                },
            };
        });
        builder.addCase(doOrganizationFetch.rejected, (state, action) => {
            return {
                ...state,
                organization: {
                    ...state.organization,
                    isFetching: false,
                    error: action.error,
                },
            };
        });
    },
});
