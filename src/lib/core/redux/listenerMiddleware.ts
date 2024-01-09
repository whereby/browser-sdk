import { createListenerMiddleware, addListener } from "@reduxjs/toolkit";
import type { TypedStartListening, TypedAddListener, Selector } from "@reduxjs/toolkit";

import type { RootState, AppDispatch } from "./store";
import { createServices } from "../../services";

export const listenerMiddleware = createListenerMiddleware();

export type AppStartListening = TypedStartListening<RootState, AppDispatch, ReturnType<typeof createServices>>;

export const startAppListening = listenerMiddleware.startListening as AppStartListening;

export const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>;

type SelectorResults<Selectors extends Selector<RootState, unknown>[]> = {
    [K in keyof Selectors]: Selectors[K] extends Selector<RootState, infer R> ? R : never;
};
/**
 * Creates a reactor that will be called whenever the provided selectors change.
 * Every reactor needs to update a piece of state that it depends on, to avoid infinite loops.
 * example:
 * ```ts
 * createReactor(
 *    [selectAppWantsToJoin, selectDeviceCredentialsRaw],
 *   ({ dispatch }, wantsToJoin, deviceCredentialsRaw) => {
 *      if (wantsToJoin && deviceCredentialsRaw.data) {
 *         dispatch(doSignalIdentifyDevice({ deviceCredentials: deviceCredentialsRaw.data }));
 *    }
 * });
 * ```
 * @param selectors. The selectors to be used to check if the state has changed.
 * @param callback. The callback to be called on every action. The first argument is the listenerApi, the second argument is the result of the selectors.
 * @returns The unsubscribe function.
 */
export const createReactor = <Selectors extends Selector<RootState, unknown>[]>(
    selectors: readonly [...Selectors],
    callback: (
        api: {
            dispatch: AppDispatch;
            getState: () => RootState;
            extra: ReturnType<typeof createServices>;
        },
        ...selectorValues: SelectorResults<Selectors>
    ) => void | Promise<void>
) => {
    return startAppListening({
        predicate: (_, currentState, previousState) => {
            const previousValues = selectors.map((selector) => selector(previousState));
            const currentValues = selectors.map((selector) => selector(currentState));

            return previousValues.some((previousValue, index) => previousValue !== currentValues[index]);
        },
        effect: (action, { dispatch, getState, extra }) => {
            const selectorResults = selectors.map((selector) => selector(getState())) as SelectorResults<Selectors>;

            callback(
                {
                    dispatch,
                    getState,
                    extra,
                },
                ...selectorResults
            );
        },
    });
};
