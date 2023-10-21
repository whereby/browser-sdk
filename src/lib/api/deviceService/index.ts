import ApiClient from "../ApiClient";
import Credentials from "../Credentials";

/**
 * Related to device calls needed to obtain credentials
 */
export default class DeviceService {
    _apiClient: ApiClient;

    constructor({ apiClient }: { apiClient: ApiClient }) {
        this._apiClient = apiClient;
    }

    /**
     * Get's the device credentials needed for most of the other API services
     *
     * @return {Promise} A promise which is fulfilled or failed based on the
     * response.
     */
    getCredentials(): Promise<Credentials | null> {
        return this._apiClient
            .request("/devices", {
                method: "post",
            })
            .then(({ data }) => {
                return Credentials.fromJson(data);
            })
            .catch((error) => {
                if (error.response) {
                    // The request was made, but the server responded with a status code
                    // that falls out of the range of 2xx
                    if (error.response.status === 404) {
                        return null;
                    }
                }

                // Something happened in setting up the request that triggered an Error
                throw error;
            });
    }
}
