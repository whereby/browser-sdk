import { createListenerMiddleware, addListener } from "@reduxjs/toolkit";
import type { TypedStartListening, TypedAddListener, ListenerEffect, AnyAction } from "@reduxjs/toolkit";

import type { RootState, AppDispatch } from "./store";
import { createServices } from "../../../services";

export const listenerMiddleware = createListenerMiddleware();

export type AppStartListening = TypedStartListening<RootState, AppDispatch, ReturnType<typeof createServices>>;

export const startAppListening = listenerMiddleware.startListening as AppStartListening;

export const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>;

/**
 * Creates a reactor that will be called on every action.
 * Every reactor needs to update a piece of state that it depends on, to avoid infinite loops.
 * example:
 * ```ts
 * createReactor((action, { dispatch, getState }) => {
 *   const stateField = selectState(getState());
 *
 *   if (stateField !== "some value") {
 *      // The action here needs to update the stateField to "some value"
 *      dispatch(someAction());
 *   }
 * }));
 * ```
 * @param callback. The callback to be called on every action.
 * @returns The unsubscribe function.
 */
export const createReactor = (
    callback: ListenerEffect<AnyAction, RootState, AppDispatch, ReturnType<typeof createServices>>
) => {
    return startAppListening({
        predicate: () => true,
        effect: callback,
    });
};
