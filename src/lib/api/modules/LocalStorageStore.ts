import { assertString, assertTruthy } from "../parameterAssertUtils";
import { Json } from "../Response";
import AbstractStore from "./AbstractStore";

/**
 * Utility to ease handling localStorage.
 */
export default class LocalStorageStore implements AbstractStore {
    _key: string;
    _localStorage: Storage;

    constructor(key: string, localStorage: Storage) {
        assertTruthy(localStorage, "localStorage");
        this._key = assertString(key, "key");
        this._localStorage = localStorage;
    }

    /**
     * Returns the stored value for this store, or a default if not available.
     *
     * @param {(Object|Array.|string|number)} [defaultValue] - Value returned if the object can't be retrieved.
     * @return {?(Object|Array.|string|number)} Value stored, or defaultValue if not available.
     */
    loadOrDefault(defaultValue: Json): Promise<Json> {
        try {
            const value = this._localStorage.getItem(this._key);
            if (value) {
                try {
                    return Promise.resolve(JSON.parse(value));
                } catch (e) {
                    /* NOOP */
                }
            }
            return Promise.resolve(defaultValue);
        } catch (e) {
            // Cookies are blocked
            console.warn("Error getting access to storage. Are cookies blocked?", e); // eslint-disable-line no-console
            return Promise.resolve(defaultValue);
        }
    }

    /**
     * Change the value stored for this key.
     *
     * @param {(Object|Array.|string|number)} [value] - New value, will replace any previously stored.
     */
    save(value: Json): Promise<void> {
        try {
            this._localStorage.setItem(this._key, JSON.stringify(value));
            return Promise.resolve();
        } catch (e) {
            /* NOOP, cookies are blocked */
            console.warn("Error getting access to storage. Are cookies blocked?", e); // eslint-disable-line no-console
            return Promise.reject(e);
        }
    }
}
