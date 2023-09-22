import { Action, RoomConnectionState } from "..";

type StateKeys = {
    [K in keyof RoomConnectionState]: K;
}[keyof RoomConnectionState];

export type Slice<T> = {
    initialState: T;
    reducer: (state: T, action: Action) => T;
};

export function createSlice<T extends StateKeys>(slice: Slice<T>) {
    return slice;
}
