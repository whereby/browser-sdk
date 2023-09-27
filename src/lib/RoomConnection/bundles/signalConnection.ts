import { Bundle } from ".";

export type SignalConnectionState = {
    status: "connected";
};

const slice: Bundle<SignalConnectionState> = {
    initialState: {
        status: "connected",
    },
    reducer: (state) => {
        return state;
    },
};

export default slice;
