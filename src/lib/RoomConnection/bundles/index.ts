import { combineLatest, distinctUntilChanged, map, Observable, ObservableInputTuple, scan, Subject } from "rxjs";
import app, { Action as AppAction } from "./app";
import deviceCredentials, { Action as DeviceCredentialAction } from "./deviceCredentials";

export type Bundle<T> = {
    initialState: T;
    reducer: (state: T, action: Action) => T;
};

export function createBundle<T>(bundle: Bundle<T>) {
    return bundle;
}

/**
 * 
 * @returns scan((state, action) => {
                return {
                    ...state,
                    deviceCredentials: {
                        ...deviceCredentials.reducer(state.deviceCredentials, action),
                    },
                    signalConnection: {
                        ...signalConnection.reducer(state.signalConnection, action),
                    },
                };
            }, initialState)
 */

/*         export function combineReducers<S>(
                reducers: ReducersMapObject<S, any>
              ): Reducer<CombinedState<S>>*/

export type Action = AppAction | DeviceCredentialAction;

/*export interface AnyAction extends Action {
    // Allows any extra properties to be defined in an action.
    [extraProps: string]: any;
}*/

declare const $CombinedState: unique symbol;
interface EmptyObject {
    readonly [$CombinedState]?: undefined;
}

export type Reducer<S = any, A extends Action = Action> = (state: S, action: A) => S;
export type CombinedState<S> = EmptyObject & S;
export type ReducersMapObject<S = any, A extends Action = Action> = {
    [K in keyof S]: Reducer<S[K], A>;
};

function combineReducers<S>(reducers: ReducersMapObject<S, any>): Reducer<CombinedState<S>> {
    // First get an array with all the keys of the reducers (the reducer names)
    const reducerKeys = Object.keys(reducers);

    return (s, a) => {
        return s;
    };
    /*return function combination(state, action: AnyAction) {
        // This is the object we are going to return.
        const nextState = {};

        // Loop through all the reducer keys
        for (let i = 0; i < reducerKeys.length; i++) {
            // Get the current key name
            const key = reducerKeys[i];
            // Get the current reducer
            const reducer = reducers[key];
            // Get the the previous state
            const previousStateForKey = state[key];
            // Get the next state by running the reducer
            const nextStateForKey = reducer(previousStateForKey, action);
            // Update the new state for the current reducer
            nextState[key] = nextStateForKey;
        }
        return nextState;
    };*/
}

export function createReducer() {
    return combineReducers({ app: app.reducer, deviceCredentials: deviceCredentials.reducer });
}

const rootReducer = createReducer();
export type RootState = ReturnType<typeof rootReducer>;

const action$ = new Subject<Action>();
export const state$ = action$.pipe(
    scan(createReducer(), {
        app: { wantsJoin: false },
        deviceCredentials: { data: null, isFetching: false },
    })
);

export type Fn = (...args: any) => any;
export type Reaction<T extends Fn> =
    | {
          action: T;
          args: Parameters<T>;
      }
    | undefined;

export function createReactor<A extends readonly unknown[], R extends Fn>(
    inputs: readonly [...ObservableInputTuple<A>],
    reactorFn: (...values: A) => Reaction<R>
): Observable<Reaction<R>> {
    return combineLatest(inputs, reactorFn);
}

export const reaction = <A extends Fn>(reaction: Reaction<A>): Reaction<A> => {
    return reaction;
};

export function dispatch(action: Action) {
    action$.next(action);
}

type Selector<Inputs extends readonly unknown[], ResultType> = {
    observable: Observable<ResultType>;
    selectorFn: (...inputs: Inputs) => ResultType;
};

export function createSelector<A extends readonly unknown[], R extends Fn>(
    inputs: readonly [...ObservableInputTuple<A>],
    selectorFn: (...inputs: A) => R
): Selector<A, R> {
    const stream = combineLatest(inputs, selectorFn);
    return { observable: stream, selectorFn };
}

export function createSelectorRaw<ResultType>(
    selectorFn: (state: RootState) => ResultType
): Selector<[RootState], ResultType> {
    const stream = state$.pipe(map(selectorFn), distinctUntilChanged());
    return { observable: stream, selectorFn };
}
