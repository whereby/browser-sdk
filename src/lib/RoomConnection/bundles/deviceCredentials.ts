import { createBundle, createReactor, createSelectorRaw, Fn, reaction, Reaction } from ".";
import { selectAppWantsToJoin } from "./app";

export type Action =
    | {
          type: "DEVICE_CREDENTIALS_FETCH_STARTED";
      }
    | {
          type: "DEVICE_CREDENTIALS_FETCH_FINISHED";
          payload: 2;
      };

const bundle = createBundle({
    initialState: {
        isFetching: false,
        data: null,
    },
    reducer: (state) => {
        return state;
    },
});

export const doGetDeviceCredentials = (val: string, v2: string) => val;

export const selectDeviceCredentialsRaw = createSelectorRaw((state) => state.deviceCredentials);

export const reactDeviceCredentialsGet = createReactor(
    [selectAppWantsToJoin.observable, selectDeviceCredentialsRaw.observable],
    (wantsToJoin, deviceCredentialsRaw) => {
        if (wantsToJoin && !deviceCredentialsRaw.data && !deviceCredentialsRaw.isFetching) {
            return reaction({ action: doGetDeviceCredentials, args: ["", "ds"] });
        }
        return undefined;
    }
);

export default bundle;
