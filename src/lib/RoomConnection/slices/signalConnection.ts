import { Slice } from ".";

export type SignalConnectionState = {
    status: "connected";
};

const slice: Slice<SignalConnectionState> = {
    initialState: {
        status: "connected",
    },
    reducer: (state) => {
        return state;
    },
};

export default slice;
