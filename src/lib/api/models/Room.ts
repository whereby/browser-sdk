// @ts-nocheck
import assert from "@whereby/jslib-media/src/utils/assert";

export default class Room {
    public readonly isLocked: boolean;

    constructor(properties = {}) {
        assert.ok(properties instanceof Object, "properties<object> must be empty or an object");

        this.isClaimed = false;
        this.isBanned = false;
        this.isLocked = false;
        this.knockPage = {
            backgroundImageUrl: null,
            backgroundThumbnailUrl: null,
        };
        this.logoUrl = null;
        this.backgroundImageUrl = null;
        this.backgroundThumbnailUrl = null;
        this.type = null;
        this.legacyRoomType = null;
        this.mode = null;
        this.product = null;
        this.roomName = null;
        this.theme = null;
        this.preferences = {};
        this.protectedPreferences = {};
        this.publicProfile = null;

        // Only allow existing property names to be modified
        const validProperties = {};
        Object.getOwnPropertyNames(properties).forEach((prop) => {
            if (Object.getOwnPropertyNames(this).indexOf(prop) !== -1) {
                validProperties[prop] = properties[prop];
            }
        });
        if (properties.ownerId !== undefined) {
            this.ownerId = properties.ownerId;
        }
        if (properties.meeting !== undefined) {
            this.meeting = properties.meeting;
        }

        Object.assign(this, validProperties);
    }
}
