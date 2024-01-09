/**
 * Utility to handle storing data in chrome.storage
 */
import { Json } from "../Response";
import AbstractStore from "./AbstractStore";

export default class ChromeStorageStore implements AbstractStore {
    _key: string;
    _chromeStorage: chrome.storage.StorageArea;

    constructor(key: string, chromeStorage: chrome.storage.StorageArea) {
        this._key = key;
        this._chromeStorage = chromeStorage;
    }

    /**
     * Returns the stored value for this store, or a default if not available.
     *
     * @param {(Object|Array.|string|number)} [defaultValue] - Value returned if the object can't be retrieved.
     * @return {?(Object|Array.|string|number)} Value stored, or defaultValue if not available.
     */
    loadOrDefault(defaultValue: Json): Promise<Json> {
        return new Promise((resolve) => {
            this._chromeStorage.get(this._key, (result) => {
                const unknownResult: Record<string, Json> = result;
                resolve(unknownResult[this._key] || defaultValue);
            });
        });
    }

    /**
     * Change the value stored for this key.
     *
     * @param {(Object|Array.|string|number)} [value] - New value, will replace any previously stored.
     * @return {Promise<void>}
     */
    save(value: Json): Promise<void> {
        return new Promise((resolve) => {
            this._chromeStorage.set({ [this._key]: value }, () => {
                resolve();
            });
        });
    }
}
