import { createListenerMiddleware, addListener } from "@reduxjs/toolkit";
import type { TypedStartListening, TypedAddListener, ListenerEffect, AnyAction, Selector } from "@reduxjs/toolkit";

import type { RootState, AppDispatch } from "./store";
import { createServices } from "../../../services";

export const listenerMiddleware = createListenerMiddleware();

export type AppStartListening = TypedStartListening<RootState, AppDispatch, ReturnType<typeof createServices>>;

export const startAppListening = listenerMiddleware.startListening as AppStartListening;

export const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>;

/**
 * Creates a reactor that will be called whenever the provided selectors change.
 * Every reactor needs to update a piece of state that it depends on, to avoid infinite loops.
 * example:
 * ```ts
 * createReactor([selectState], (action, { dispatch, getState }) => {
 *   const stateField = selectState(getState());
 *
 *   if (stateField !== "some value") {
 *      // The action here needs to update the stateField to "some value"
 *      dispatch(someAction());
 *   }
 * }));
 * ```
 * @param selectors. The selectors to be used to check if the state has changed.
 * @param callback. The callback to be called on every action.
 * @returns The unsubscribe function.
 */
export const createReactor = (
    selectors: Selector<RootState, unknown>[],
    callback: ListenerEffect<AnyAction, RootState, AppDispatch, ReturnType<typeof createServices>>
) => {
    return startAppListening({
        predicate: (action, currentState, previousState) => {
            const previousValues = selectors.map((selector) => selector(previousState));
            const currentValues = selectors.map((selector) => selector(currentState));

            return previousValues.some((value, index) => value !== currentValues[index]);
        },
        effect: callback,
    });
};
