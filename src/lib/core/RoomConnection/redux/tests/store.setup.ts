import { RootState, createStore as createRealStore } from "../store";

export const mockSignalEmit = jest.fn();

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
    roomService: {
        fetchRoom: jest.fn(),
    },
};

export function createStore({ initialState, withSignalConnection }: StoreOptions = {}) {
    initialState = initialState || {};

    if (withSignalConnection) {
        initialState.signalConnection = {
            isIdentifyingDevice: false,
            deviceIdentified: true,
            isListeningForEvents: true,
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

    const store = createRealStore({
        preloadedState: initialState,
        injectServices: mockServices as any,
    });

    return store;
}
