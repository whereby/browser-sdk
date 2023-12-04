import { Credentials } from "../api";
import Organization from "../api/models/Organization";
import { SignalClient } from "@whereby/jslib-media/src/utils/ServerSocket";
import { RemoteParticipant } from "../RoomParticipant";
import { v4 as uuid } from "uuid";
import MockMediaStream from "./MediaStream";

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const noop = () => {};

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

export const randomSignalClient = ({
    displayName = randomString(),
    id = randomString(),
    streams = [],
    isAudioEnabled = true,
    isVideoEnabled = true,
    role = { roleName: "participant" },
    startedCloudRecordingAt = null,
}: Partial<SignalClient> = {}): SignalClient => {
    return {
        displayName,
        id,
        streams,
        isAudioEnabled,
        isVideoEnabled,
        role,
        startedCloudRecordingAt,
    };
};

export const randomRemoteParticipant = ({
    id = randomString(),
    displayName = randomString(),
    isAudioEnabled = true,
    isVideoEnabled = true,
    isLocalParticipant = false,
    stream = null,
    streams = [],
    newJoiner = false,
    presentationStream = null,
}: Partial<RemoteParticipant> = {}): RemoteParticipant => {
    return {
        id,
        displayName,
        isAudioEnabled,
        isVideoEnabled,
        isLocalParticipant,
        stream,
        streams,
        newJoiner,
        presentationStream,
    };
};

export const randomMediaStream = (): MediaStream => {
    return new MockMediaStream();
};
