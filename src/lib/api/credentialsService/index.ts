import EventEmitter from "events";

import DeviceService from "../deviceService/index";
import AbstractStore from "../modules/AbstractStore";
import ChromeStorageStore from "../modules/ChromeStorageStore";
import LocalStorageStore from "../modules/LocalStorageStore";
import ApiClient from "../ApiClient";
import localStorage from "../localStorageWrapper";
import Credentials from "../Credentials";

/**
 * Events triggered by this service
 */
export const events = {
    CREDENTIALS_SAVED: "credentials_saved",
};

export default class CredentialsService extends EventEmitter {
    _deviceService: DeviceService;
    _credentialsStore: AbstractStore;
    credentialsPromise?: Promise<Credentials | null>;

    /**
     * Service to manage Whereby's Rest API credentials.
     *
     * @param {ObjectStore} credentialsStore - Store to manage the credentials.
     */
    constructor({
        deviceService,
        credentialsStore,
    }: {
        deviceService: DeviceService;
        credentialsStore: AbstractStore;
    }) {
        super();
        this._deviceService = deviceService;
        this._credentialsStore = credentialsStore;
    }

    static create({
        baseUrl,
        storeName = "CredentialsStorage",
        storeType = "localStorage",
    }: {
        baseUrl: string;
        storeName?: string;
        storeType?: "localStorage" | "chromeStorage";
    }): CredentialsService {
        const deviceService = new DeviceService({
            apiClient: new ApiClient({ baseUrl }),
        });

        let credentialsStore = null;

        if (storeType === "localStorage") {
            credentialsStore = new LocalStorageStore(storeName, localStorage);
        } else if (storeType === "chromeStorage") {
            credentialsStore = new ChromeStorageStore(storeName, window["chrome"].storage.local);
        } else {
            throw new Error(`Unknown store type: ${storeType}`);
        }

        return new CredentialsService({
            deviceService,
            credentialsStore,
        });
    }
    /**
     * Contacts the REST API to get new credentials. DO NOT USE directly, call getCredentials() instead.
     *
     * @see getCredentials
     * @returns {Promise.<Credentials>} - Promise that resolves with the credentials.
     */
    _fetchNewCredentialsFromApi(): Promise<Credentials | null> {
        const credentialsStore = this._credentialsStore;
        return new Promise((resolve) => {
            const fetchCredentials = () => {
                this._deviceService
                    .getCredentials()
                    .then((credentials) => {
                        return credentialsStore
                            .save(credentials ? credentials.toJson() : null)
                            .then(() => resolve(credentials));
                    })
                    .catch(() => {
                        setTimeout(fetchCredentials, 2000);
                    });
            };
            fetchCredentials();
        });
    }

    /**
     * Returns the current credentials without triggering an API request to get new ones.
     * If no credentials are currently available it will return null.
     *
     * @returns {?Credentials} - The credentials currently in use, null otherwise.
     */
    getCurrentCredentials(): Promise<Credentials | null> {
        return this._credentialsStore.loadOrDefault(null).then((json) => (json ? Credentials.fromJson(json) : null));
    }

    /**
     * Returns a promise that will contain the credentials for this client.
     * If no credentials are available in local storage, new ones will be fetched from the server.
     *
     * @returns {Promise.<Credentials>} - Promise that resolves with the credentials.
     */
    getCredentials(): Promise<Credentials | null> {
        if (!this.credentialsPromise) {
            this.credentialsPromise = this.getCurrentCredentials().then((storedCredentials) => {
                if (storedCredentials) {
                    return storedCredentials;
                }

                return this._fetchNewCredentialsFromApi();
            });
        }

        return this.credentialsPromise;
    }

    /**
     * Saves new credentials which replace the existing ones and abort any pending request to get new ones.
     *
     * @param {Credentials} credentials - New credentials to store.
     */
    saveCredentials(credentials: Credentials): Promise<Credentials> {
        this.credentialsPromise = undefined;
        return this._credentialsStore.save(credentials.toJson()).then(() => {
            this.emit(events.CREDENTIALS_SAVED, credentials);
            return credentials;
        });
    }

    /**
     * It will set the userId for the current credentials.
     *
     * @param userId - The user id to set.
     */
    setUserId(userId: string | null): Promise<void> {
        // Used to ensure that the userId is changed if localStorage has been modified by another tab
        return this.getCurrentCredentials()
            .then((storedCredentials) => {
                if (!storedCredentials) {
                    console.error("Illegal state: no credentials to set user id for."); // eslint-disable-line no-console
                }

                const userIdChangedFromLocalStorage = storedCredentials === null || storedCredentials.userId !== userId;
                if (!userIdChangedFromLocalStorage) {
                    return undefined;
                }

                return this._credentialsStore.save(Object.assign({}, storedCredentials?.toJson(), { userId }));
            })
            .then(() => undefined);
    }
}
