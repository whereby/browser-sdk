import { Dispatch, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "../store";
import RtcManager from "@whereby/jslib-media/src/webrtc/RtcManager";
import { selectSignalConnectionRaw } from "./signalConnection";
import RtcManagerDispatcher, {
    RtcEvents,
    RtcManagerCreatedPayload,
    RtcStreamAddedPayload,
} from "@whereby/jslib-media/src/webrtc/RtcManagerDispatcher";
import { startAppListening } from "../listenerMiddleware";

export interface RtcConnectionState {
    error: unknown;
    status: "" | "ready" | "reconnect";
    isCreatingDispatcher: boolean;
    dispatcherCreated: boolean;
    rtcManagerDispatcher: RtcManagerDispatcher | null;
    rtcManager: RtcManager | null;
}

const initialState: RtcConnectionState = {
    error: null,
    status: "",
    isCreatingDispatcher: false,
    dispatcherCreated: false,
    rtcManagerDispatcher: null,
    rtcManager: null,
};

const webrtcProvider = {
    getMediaConstraints: () => ({
        audio: true,
        video: true,
    }),
    deferrable(clientId: string) {
        return !clientId;
    },
};

export const createWebRtcEmitter = (dispatch: AppDispatch) => {
    return {
        emit: (eventName: keyof RtcEvents, data: RtcEvents[keyof RtcEvents]) => {
            if (eventName === "rtc_manager_created") {
                dispatch(doRtcManagerCreated(data as RtcManagerCreatedPayload));
            } else if (eventName === "stream_added") {
                // dispatch(doStreamAdded(data as RtcStreamAddedPayload));
            } else if (eventName === "rtc_manager_destroyed") {
                dispatch(doRtcManagerDestroyed());
            } else {
                console.log(`Unhandled RTC event ${eventName}`);
            }
        },
    };
};

export const doRtcManagerCreated = createAsyncThunk(
    "rtcConnection/doRtcManagerCreated",
    async (payload: RtcManagerCreatedPayload, { dispatch }) => {
        const { rtcManager } = payload;
        console.log("RTC MANAGER CREATED", rtcManager);

        return rtcManager;
    }
);

export const doConnectRtc = createAsyncThunk("rtcConnection/doConnectRtc", async (payload, { dispatch, getState }) => {
    const state = getState() as RootState;
    const appDispatch = dispatch as AppDispatch;
    const socket = selectSignalConnectionRaw(state).socket;

    const rtcManagerDispatcher = new RtcManagerDispatcher({
        emitter: createWebRtcEmitter(appDispatch),
        serverSocket: socket,
        webrtcProvider,
        features: {
            lowDataModeEnabled: false,
            sfuServerOverrideHost: undefined,
            turnServerOverrideHost: undefined,
            useOnlyTURN: undefined,
            vp9On: false,
            h264On: false,
            simulcastScreenshareOn: false,
        },
    });

    return rtcManagerDispatcher;
});

export const rtcConnectionSlice = createSlice({
    name: "rtcConnection",
    initialState,
    reducers: {
        doRtcManagerDestroyed: (state) => {
            return {
                ...state,
                dispatcherCreated: false,
                rtcManagerDispatcher: null,
                rtcManager: null,
            };
        },
    },
    extraReducers: (builder) => {
        builder.addCase(doConnectRtc.pending, (state) => {
            return {
                ...state,
                isCreatingDispatcher: true,
            };
        });
        builder.addCase(doConnectRtc.fulfilled, (state, action) => {
            return {
                ...state,
                dispatcherCreated: true,
                rtcManagerDispatcher: action.payload,
            };
        });
        builder.addCase(doRtcManagerCreated.fulfilled, (state, action) => {
            return {
                ...state,
                rtcManager: action.payload,
            };
        });
    },
});

export const { doRtcManagerDestroyed } = rtcConnectionSlice.actions;

export const selectRtcConnectionRaw = (state: RootState) => state.rtcConnection;

startAppListening({
    predicate: (action, currentState) => {
        const rtcConnectionRaw = selectRtcConnectionRaw(currentState);
        const signalConnectionRaw = selectSignalConnectionRaw(currentState);

        if (
            !rtcConnectionRaw.dispatcherCreated &&
            !rtcConnectionRaw.isCreatingDispatcher &&
            !!signalConnectionRaw.socket
        ) {
            return true;
        }
        return false;
    },
    effect: (action, { dispatch }) => {
        dispatch(doConnectRtc());
    },
});
