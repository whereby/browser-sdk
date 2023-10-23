import { PreloadedState, configureStore } from "@reduxjs/toolkit";
import { listenerMiddleware } from "./listenerMiddleware";
import { RootState, rootReducer } from "./reducer";

export const createStore = ({ preloadedState }: { preloadedState?: PreloadedState<RootState> }) => {
    return configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: {
                    extraArgument: {},
                },
                serializableCheck: false,
            }).prepend(listenerMiddleware.middleware),
        preloadedState,
    });
};

export const store = createStore({});
export type Store = typeof store;

export const observeStore = <T>(store: Store, select: (state: RootState) => T, onChange: (result: T) => void) => {
    let currentState: T;

    function handleChange() {
        const nextState = select(store.getState());
        if (nextState !== currentState) {
            currentState = nextState;
            onChange(currentState);
        }
    }

    const unsubscribe = store.subscribe(handleChange);
    handleChange();
    return unsubscribe;
};
