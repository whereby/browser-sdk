import { createBundle, createSelectorRaw, dispatch } from ".";

export type Action = {
    type: "APP_JOIN";
};

const bundle = createBundle({
    initialState: {
        wantsJoin: false,
    },
    reducer: (state, action) => {
        switch (action.type) {
            case "APP_JOIN":
                return {
                    ...state,
                    wantsJoin: true,
                };
        }

        return state;
    },
});

export const doAppJoin = () => {
    dispatch({ type: "APP_JOIN" });
};

export const selectAppWantsToJoin = createSelectorRaw((state) => state.app.wantsJoin);

export default bundle;
