import { createStore } from "../redux/store";

export const mockStore = createStore({});

export const initialState = mockStore.getState();
