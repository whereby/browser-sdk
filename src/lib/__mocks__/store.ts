import { createStore } from "../core/RoomConnection/redux/store";

export const mockStore = createStore({});

export const initialState = mockStore.getState();
