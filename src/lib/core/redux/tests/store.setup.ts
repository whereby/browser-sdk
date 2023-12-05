import { RootState, createStore as createRealStore } from "../store";

export const mockSignalEmit = jest.fn();
export const mockRtcManager: any = {};

const fn = ({ emitter }: { emitter: any }) => {
    // emitter.emit("rtc_manager_created", { rtcManager: mockRtcManager });

    return {
        stopRtcManager: jest.fn(),
    };
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
mockRtcManager.addNewStream = () => {};
// used for initial mute state
// eslint-disable-next-line @typescript-eslint/no-empty-function
mockRtcManager.sendAudioMutedStats = () => {};
// eslint-disable-next-line @typescript-eslint/no-empty-function
mockRtcManager.sendVideoMutedStats = () => {};

beforeEach(() => {
    jest.useFakeTimers();
    mockSignalEmit.mockClear();
    jest.clearAllMocks();
    jest.restoreAllMocks();

    console.error = (msg) => {
        throw new Error(`Got console.error: ${msg}`);
    };
    console.warn = (msg) => {
        throw new Error(`Got console.warn: ${msg}`);
    };
});

type StoreOptions = {
    initialState?: Partial<RootState>;
    withSignalConnection?: boolean;
    withRtcManager?: boolean;
};

export const mockServices = {
    apiClient: jest.fn(),
    organizationApiClient: jest.fn(),
    credentialsService: {
        getCredentials: jest.fn(),
    },
    organizationService: {
        fetchOrganization: jest.fn(),
    },
    organizationServiceCache: {
        fetchOrganization: jest.fn(),
    },
    fetchOrganizationFromRoomUrl: jest.fn(),
};

export function createStore({ initialState, withSignalConnection, withRtcManager }: StoreOptions = {}) {
    initialState = initialState || {};

    if (withSignalConnection) {
        initialState.signalConnection = {
            isIdentifyingDevice: false,
            deviceIdentified: true,
            status: "connected",
            socket: {
                on: jest.fn(),
                connect: jest.fn(),
                disconnect: jest.fn(),
                getManager: jest.fn(),
                once: jest.fn(),
                emit: mockSignalEmit,
            },
        };
    }

    if (withRtcManager) {
        initialState.rtcConnection = {
            status: "ready",
            isCreatingDispatcher: false,
            dispatcherCreated: true,
            error: null,
            reportedStreamResolutions: {},
            rtcManagerDispatcher: fn({ emitter: jest.fn() }),
            rtcManagerInitialized: true,
            rtcManager: mockRtcManager,
        };
    } else {
        initialState.rtcConnection = {
            status: "",
            isCreatingDispatcher: false,
            dispatcherCreated: false,
            error: null,
            reportedStreamResolutions: {},
            rtcManagerDispatcher: fn({ emitter: jest.fn() }),
            rtcManagerInitialized: false,
            rtcManager: null,
        };
    }

    const store = createRealStore({
        preloadedState: initialState,
        injectServices: mockServices as any,
    });

    return store;
}
