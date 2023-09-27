import { scan, Subject } from "rxjs";
import { Action, RootState, createReducer } from "./bundles";

export default class RoomConnection {
    constructor() {
        const action$ = new Subject<Action>();
        const state$ = action$.pipe(
            scan(createReducer(), {
                app: { data: null, isFetching: false },
                deviceCredentials: { data: null, isFetching: false },
            })
        );
    }
}
