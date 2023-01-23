/*
 * Abstract class which all credential stores needs to inherit to
 * be usable with CredentialsService
 */

import { Json } from "../Response";

export default interface AbstractStore {
    /*
     * Get value
     */
    loadOrDefault(defaultValue: Json): Promise<Json>;

    /*
     * Set value
     */
    save(value: Json): Promise<void>;
}
