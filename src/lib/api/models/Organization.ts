import { assertInstanceOf, assertString } from "../parameterAssertUtils";
import { Json } from "../Response";

import Account from "./Account";

interface OrganizationPermissionAction {
    isAllowed: boolean;
    isSupported: boolean;
}

interface FullOrganizationPermissions {
    images: {
        logoImageUrl: {
            set: OrganizationPermissionAction;
            reset: OrganizationPermissionAction;
        };
        roomBackgroundImageUrl: {
            set: OrganizationPermissionAction;
            reset: OrganizationPermissionAction;
        };
        roomKnockPageBackgroundImageUrl: {
            set: OrganizationPermissionAction;
            reset: OrganizationPermissionAction;
        };
    };
    invitations: {
        add: OrganizationPermissionAction;
        delete: OrganizationPermissionAction;
        list: OrganizationPermissionAction;
    };
    roles: {
        set: OrganizationPermissionAction;
        remove: OrganizationPermissionAction;
        removeSelf: OrganizationPermissionAction;
        list: OrganizationPermissionAction;
    };
    users: {
        signUpWithoutInvitation: OrganizationPermissionAction;
    };
    rooms: {
        customize: OrganizationPermissionAction;
        customizeSelf: OrganizationPermissionAction;
        list: OrganizationPermissionAction;
        lock: OrganizationPermissionAction;
        unclaim: OrganizationPermissionAction;
        unclaimSelf: OrganizationPermissionAction;
    };
    subscriptions: {
        add: OrganizationPermissionAction;
        list: OrganizationPermissionAction;
        payLatestInvoice: OrganizationPermissionAction;
        updatePlan: OrganizationPermissionAction;
    };
    browserExtension: {
        install: OrganizationPermissionAction;
    };
}
type OrganizationPermissions = Partial<FullOrganizationPermissions>;

interface OrganizationLimits {
    maxNumberOfInvitationsAndUsers: number | null;
    maxNumberOfClaimedRooms: number | null;
    maxRoomLimitPerOrganization: number | null;
    trialMinutesLimit: number | null;
    includedUnits: number | null;
}
interface OrganizationOnboardingSurvey {
    name: string;
    value: unknown;
}

export type OrganizationPreferences = Record<string, boolean | string | null | number>;

export function hasValue(value: unknown): boolean {
    return value !== null && value !== undefined;
}

function createOrganizationLimits(limits: Record<string, unknown> = {}): OrganizationLimits {
    return {
        maxNumberOfInvitationsAndUsers: hasValue(limits?.maxNumberOfInvitationsAndUsers)
            ? Number(limits?.maxNumberOfInvitationsAndUsers)
            : null,
        maxNumberOfClaimedRooms: hasValue(limits?.maxNumberOfClaimedRooms)
            ? Number(limits?.maxNumberOfClaimedRooms)
            : null,
        maxRoomLimitPerOrganization: hasValue(limits?.maxRoomLimitPerOrganization)
            ? Number(limits?.maxRoomLimitPerOrganization)
            : null,
        trialMinutesLimit: hasValue(limits?.trialMinutesLimit) ? Number(limits?.trialMinutesLimit) : null,
        includedUnits: hasValue(limits?.includedUnits) ? Number(limits?.includedUnits) : null,
    };
}

export default class Organization {
    static GLOBAL_ORGANIZATION_ID = "1";

    organizationId: string;
    organizationName: string;
    subdomain: string;
    permissions: OrganizationPermissions;
    limits: OrganizationLimits;
    account: Account | null;
    logoImageUrl: string | null = null;
    roomBackgroundImageUrl: string | null = null;
    roomBackgroundThumbnailUrl: string | null = null;
    roomKnockPageBackgroundImageUrl: string | null = null;
    roomKnockPageBackgroundThumbnailUrl: string | null = null;
    preferences: OrganizationPreferences | null = null;
    onboardingSurvey: OrganizationOnboardingSurvey | null = null;
    type: string | null = null;

    constructor(properties: {
        account: Account | null;
        organizationId: string;
        organizationName: string;
        subdomain: string;
        permissions: OrganizationPermissions;
        limits: OrganizationLimits;
        logoImageUrl: string | null;
        roomBackgroundImageUrl: string | null;
        roomBackgroundThumbnailUrl: string | null;
        roomKnockPageBackgroundImageUrl: string | null;
        roomKnockPageBackgroundThumbnailUrl: string | null;
        preferences: OrganizationPreferences | null;
        onboardingSurvey: OrganizationOnboardingSurvey | null;
        type: string | null;
    }) {
        assertInstanceOf(properties, Object, "properties");
        assertString(properties.organizationId, "organizationId");
        assertString(properties.organizationName, "organizationName");
        assertString(properties.subdomain, "subdomain");
        assertInstanceOf(properties.permissions, Object, "permissions");
        assertInstanceOf(properties.limits, Object, "limits");

        this.organizationId = properties.organizationId;
        this.organizationName = properties.organizationName;
        this.subdomain = properties.subdomain;
        this.permissions = properties.permissions;
        this.limits = properties.limits;
        this.account = properties.account ? new Account(properties.account) : null;
        this.logoImageUrl = properties.logoImageUrl;
        this.roomBackgroundImageUrl = properties.roomBackgroundImageUrl;
        this.roomBackgroundThumbnailUrl = properties.roomBackgroundThumbnailUrl;
        this.roomKnockPageBackgroundImageUrl = properties.roomKnockPageBackgroundImageUrl;
        this.roomKnockPageBackgroundThumbnailUrl = properties.roomKnockPageBackgroundThumbnailUrl;
        this.preferences = properties.preferences;
        this.onboardingSurvey = properties.onboardingSurvey;
        this.type = properties.type;
    }

    static fromJson(data: Json): Organization {
        const parsedData = assertInstanceOf(data, Object, "data") as Record<string, unknown>;
        const preferences = (parsedData?.preferences || {}) as OrganizationPreferences;
        const onboardingSurvey = (parsedData?.onboardingSurvey || null) as OrganizationOnboardingSurvey;
        const permissions = assertInstanceOf(parsedData.permissions, Object, "permissions") as OrganizationPreferences;

        return new Organization({
            organizationId: assertString(parsedData.organizationId, "organizationId"),
            organizationName: assertString(parsedData.organizationName, "organizationName"),
            subdomain: assertString(parsedData.subdomain, "subdomain"),
            permissions,
            limits: createOrganizationLimits(
                assertInstanceOf(parsedData.limits, Object, "limits") as Record<string, unknown>
            ),
            account: parsedData.account ? Account.fromJson(parsedData.account as Record<string, unknown>) : null,
            logoImageUrl: typeof parsedData.logoImageUrl === "string" ? parsedData.logoImageUrl : null,
            roomBackgroundImageUrl:
                typeof parsedData.roomBackgroundImageUrl === "string" ? parsedData.roomBackgroundImageUrl : null,
            roomBackgroundThumbnailUrl:
                typeof parsedData.roomBackgroundThumbnailUrl === "string"
                    ? parsedData.roomBackgroundThumbnailUrl
                    : null,
            roomKnockPageBackgroundImageUrl:
                typeof parsedData.roomKnockPageBackgroundImageUrl === "string"
                    ? parsedData.roomKnockPageBackgroundImageUrl
                    : null,
            roomKnockPageBackgroundThumbnailUrl:
                typeof parsedData.roomKnockPageBackgroundThumbnailUrl === "string"
                    ? parsedData.roomKnockPageBackgroundThumbnailUrl
                    : null,
            preferences,
            onboardingSurvey,
            type: typeof parsedData.type === "string" ? parsedData.type : null,
        });
    }
}
