// @ts-nocheck
import Room from "../models/Room";
import {
    assertInstanceOf,
    assertRoomName,
    assertString,
    assertArray,
    assertOneOf,
    assertNumber,
} from "../parameterAssertUtils";
import OrganizationApiClient from "../OrganizationApiClient";
import Meeting from "../models/Meeting";

function createRoomUrl(roomName, path = "") {
    const encodedDisplayName = encodeURIComponent(roomName.substring(1));
    return `/room/${encodedDisplayName}${path}`;
}

/**
 * Service for talking to the Room related APIs
 */
export default class RoomService {
    /**
     * @param {object} organizationApiClient (required)
     */
    constructor({ organizationApiClient }) {
        this._organizationApiClient = assertInstanceOf(organizationApiClient, OrganizationApiClient);
    }

    /**
     * Gets the list of visited rooms
     *
     * @param {Object} args
     * @param {Array<string>} [types=["team"]] - The type of rooms that should be fetched.
     * @param {Array<string>} [fields=["meeting"]] - The fields of room that should be fetched.
     * @returns {Promise<array>} - It will resolve with an array.
     */
    getRooms({ types, fields = [] } = {}) {
        assertArray(types, "types");
        assertArray(fields, "fields");
        return this._organizationApiClient
            .request("/room", {
                method: "GET",
                params: { types: types.join(","), fields: fields.join(","), includeOnlyLegacyRoomType: "false" },
            })
            .then(({ data }) => data.rooms.map((room) => new Room(room)));
    }

    /**
     * Gets the specified room.
     *
     * Currently information is implicitly alluded to via the servers
     * `/room/roomName` response. This method patches the data
     * tempoarily, until the day it comes back from the server.
     *
     * @returns {Promise<Room>} - It will resolve with the Room.
     */
    getRoom({ roomName, fields }: { roomName: string; fields?: Array<string> }): Promise<Room> {
        assertRoomName(roomName);

        const encodedDisplayName = encodeURIComponent(roomName.substring(1));

        return this._organizationApiClient
            .request(`/rooms/${encodedDisplayName}`, {
                method: "GET",
                params: { includeOnlyLegacyRoomType: "false", ...(fields && { fields: fields.join(",") }) },
            })
            .then(
                ({ data }) =>
                    new Room(
                        Object.assign({}, data, {
                            roomName,
                            ...(data.meeting && { meeting: Meeting.fromJson(data.meeting) }),
                        })
                    )
            )
            .catch((response) => {
                if (response.status === 404) {
                    return new Room({
                        roomName,
                        isClaimed: false,
                        mode: "normal",
                        product: {
                            categoryName: "personal_free",
                        },
                        type: "personal",
                        legacyRoomType: "free",
                    });
                }

                if (response.status === 400 && response.data.error === "Banned room") {
                    return new Room({ roomName, isBanned: true });
                }

                // Either server error or something else.
                throw new Error(response.data ? response.data.error : "Could not fetch room information");
            });
    }

    /**
     * Claims the specified room.
     *
     * @param {Object} args
     * @param {String} args.roomName - The roomName to claim
     * @param {String} args.type - The type of room to claim
     * @param {String} args.mode - The optional mode of room to claim
     * @param {[Boolean]} args.isLocked - The optional lock status of room to claim
     * @returns {Promise} - It will resolve with undefined.
     */
    claimRoom({ roomName, type, mode, isLocked }) {
        assertRoomName(roomName);
        assertString(type, "type");

        return this._organizationApiClient
            .request("/room/claim", {
                method: "POST",
                data: {
                    roomName,
                    type,
                    ...(typeof mode === "string" && { mode }),
                    ...(typeof isLocked === "boolean" && { isLocked }),
                },
            })
            .then(() => undefined)
            .catch((response) => {
                throw new Error(response.data.error || "Failed to claim room");
            });
    }

    /**
     * Unclaims the specified room.
     *
     * @param {string} roomName - the room name to unclaim.
     * @returns {Promise.<undefined>} - It will resolve with undefined.
     */
    unclaimRoom(roomName) {
        assertRoomName(roomName);
        const encodedDisplayName = encodeURIComponent(roomName.substring(1));

        return this._organizationApiClient
            .request(`/room/${encodedDisplayName}`, {
                method: "DELETE",
            })
            .then(() => undefined);
    }

    /**
     * Changes the name of the room
     *
     * @param {Object} args
     * @param {string} args.roomName - The name of the room to rename
     * @param {string} args.newRoomName - The new name
     * @returns {Promise<undefined>} - It will resolve if the room was renamed, reject for all other cases
     */
    renameRoom({ roomName, newRoomName }) {
        assertRoomName(roomName);
        assertString(newRoomName, "newRoomName");

        const encodedRoomName = encodeURIComponent(roomName.substring(1));
        return this._organizationApiClient

            .request(`/room/${encodedRoomName}/roomName`, {
                method: "PUT",
                data: { newRoomName },
            })
            .then(() => undefined);
    }

    /**
     * Changes the room mode (experimental)
     *
     * @param {string} roomName - The name of the room to change mode of
     * @param {string} mode - The name of mode to set, currently only "group" is supported
     * @returns {Promise<undefined>} - It will resolve if mode was changed, rejects for all other cases
     */
    changeMode({ roomName, mode }) {
        assertRoomName(roomName);
        assertString(mode, "mode");

        const encodedDisplayName = encodeURIComponent(roomName.substring(1));
        return this._organizationApiClient

            .request(`/room/${encodedDisplayName}/mode`, {
                method: "PUT",
                data: { mode },
            })
            .then(() => undefined);
    }

    /**
     * Updates the room prefs
     *
     * @param {string} roomName - The name of the room to change mode of
     * @param {object} preferences - The prefs you want to update and their values
     * @returns {Promise<undefined>} - It will resolve if updated, rejects for all other cases
     */
    updatePreferences({ roomName, preferences }) {
        assertRoomName(roomName);
        assertInstanceOf(preferences, Object, "preferences");

        const encodedDisplayName = encodeURIComponent(roomName.substring(1));
        return this._organizationApiClient
            .request(`/room/${encodedDisplayName}/preferences`, {
                method: "PATCH",
                data: preferences,
            })
            .then(() => undefined);
    }

    /**
     * Updates the protected room prefs
     *
     * @param {string} roomName - The name of the room to change mode of
     * @param {object} preferences - The protected prefs you want to update and their values
     * @returns {Promise<undefined>} - It will resolve if updated, rejects for all other cases
     */
    updateProtectedPreferences({ roomName, preferences }) {
        assertRoomName(roomName);
        assertInstanceOf(preferences, Object, "preferences");

        const encodedDisplayName = encodeURIComponent(roomName.substring(1));
        return this._organizationApiClient
            .request(`/room/${encodedDisplayName}/protected-preferences`, {
                method: "PATCH",
                data: preferences,
            })
            .then(() => undefined);
    }

    getRoomPermissions(roomName, { roomKey } = {}) {
        assertRoomName(roomName);

        return this._organizationApiClient
            .request(createRoomUrl(roomName, "/permissions"), {
                method: "GET",
                ...(roomKey && { headers: { "X-Whereby-Room-Key": roomKey } }),
            })
            .then((response) => {
                const { permissions, limits } = response.data;
                return {
                    permissions,
                    limits,
                };
            });
    }

    /**
     * Gets the specified room metrics
     *
     * @param {Object} args
     * @param {string} args.roomName - The name of the room to get metrics from.
     * @param {string} args.metrics - Comma-separated list of metrics to include.
     * @param {string} args.from (optional) - Start time (inclusive) to count from in
     * ISO format. Defaults to counting from the start of time.
     * @param {string} args.to (optional) - End time (exclusive) to count up to in
     * ISO format. Defaults to counting up to the current time.
     * @returns {Promise<Object>} - It will resolve with the requested metrics.
     */
    getRoomMetrics({ roomName, metrics, from, to }) {
        assertRoomName(roomName);
        assertString(metrics, "metrics");

        return this._organizationApiClient
            .request(createRoomUrl(roomName, "/metrics"), {
                method: "GET",
                params: { metrics, from, to },
            })
            .then((response) => response.data);
    }

    /**
     * Changes the room type
     *
     * @param {Object} args
     * @param {string} args.roomName - The name of the room to change mode of
     * @param {"personal" | "personal_xl"} args.type - Room type that should be set
     * @returns {Promise<undefined>} - It will resolve if type was changed, rejects for all other cases
     */
    changeType({ roomName, type }) {
        assertRoomName(roomName);
        assertOneOf(type, ["personal", "personal_xl"], "type");

        const encodedDisplayName = encodeURIComponent(roomName.substring(1));
        return this._organizationApiClient

            .request(`/room/${encodedDisplayName}/type`, {
                method: "PUT",
                data: { type },
            })
            .then(() => undefined);
    }

    /** Gets a Forest campaign social image
     *
     * @param {Object} args
     * @param {string} args.roomName - The name of the room to get metrics from.
     * @param {number} args.count - Number to be displayed in the image as tree count.
     * @returns {Promise<string>} - It will resolve with the image url.
     */
    getForestSocialImage({ roomName, count }) {
        assertRoomName(roomName);
        assertNumber(count, "count");

        return this._organizationApiClient
            .request(createRoomUrl(roomName, `/forest-social-image/${count}`), {
                method: "GET",
            })
            .then((response) => response.data.imageUrl);
    }
}
