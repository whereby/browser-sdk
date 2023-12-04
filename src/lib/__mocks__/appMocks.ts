import { Credentials } from "../api";
import Organization from "../api/models/Organization";
import { v4 as uuid } from "uuid";

export function oneOf<T>(...array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

export const randomString = (prefix?: string, suffix?: string): string => {
    return (prefix || "") + uuid() + (suffix || "");
};

export const randomOrganization = ({
    organizationId = randomString(),
    organizationName = randomString(),
    subdomain = randomString(),
    logoImageUrl = null,
    permissions = {},
    roomBackgroundImageUrl = null,
    roomBackgroundThumbnailUrl = null,
    roomKnockPageBackgroundImageUrl = null,
    roomKnockPageBackgroundThumbnailUrl = null,
    limits = {
        includedUnits: null,
        maxNumberOfClaimedRooms: null,
        maxNumberOfInvitationsAndUsers: null,
        maxRoomLimitPerOrganization: null,
        trialMinutesLimit: null,
    },
    account = null,
    preferences = {},
    onboardingSurvey = null,
    type = null,
}: Partial<Organization> = {}): Organization => {
    return {
        account,
        limits,
        logoImageUrl,
        onboardingSurvey,
        organizationId,
        organizationName,
        permissions,
        preferences,
        roomBackgroundImageUrl,
        roomBackgroundThumbnailUrl,
        roomKnockPageBackgroundImageUrl,
        roomKnockPageBackgroundThumbnailUrl,
        subdomain,
        type,
    };
};

export const randomDeviceCredentials = ({
    credentials = {
        uuid: randomString(),
    },
    hmac = randomString(),
    userId = randomString(),
    toJson = () => "",
}: Partial<Credentials> = {}): Credentials => {
    return {
        credentials,
        hmac,
        userId,
        toJson,
    };
};
