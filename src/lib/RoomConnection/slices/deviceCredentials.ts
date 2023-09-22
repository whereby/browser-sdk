import { Slice } from ".";

export type DeviceCredentialsState = {
    data: null;
};

const slice: Slice<DeviceCredentialsState> = {
    initialState: {
        data: null,
    },
    reducer: (state) => {
        return state;
    },
};

export const selectDeviceCredentialsRaw$ = 2;

export default slice;
