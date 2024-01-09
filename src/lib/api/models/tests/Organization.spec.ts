import Organization, { hasValue } from "../Organization";
import Account from "../Account";

const defaultOrganization = {};

describe("Organization", () => {
    const organizationId = "12";
    const organizationName = "some-name";
    const subdomain = "someOrganization";
    const account = null;
    const limits = {
        maxNumberOfClaimedRooms: null,
        maxNumberOfInvitationsAndUsers: null,
        maxRoomLimitPerOrganization: null,
        trialMinutesLimit: null,
        includedUnits: null,
    };
    const logoImageUrl = "some-logoImageUrl";
    const roomBackgroundImageUrl = "some-roomBackgroundImageUrl";
    const roomBackgroundThumbnailUrl = "some-roomBackgroundThumbnailUrl";
    const roomKnockPageBackgroundImageUrl = "some-roomKnockPageBackgroundImageUrl";
    const roomKnockPageBackgroundThumbnailUrl = "some-roomKnockPageBackgroundThumbnailUrl";
    const preferences = {};
    const onboardingSurvey = null;
    const type = "public";

    describe("constructor", () => {
        it("should return a correctly extended organization object", () => {
            const permissions = {
                cloudRecording: {
                    setConfig: { isAllowed: true, isSupported: true },
                },
                images: {
                    logoImageUrl: {
                        set: { isAllowed: true, isSupported: true },
                        reset: { isAllowed: true, isSupported: true },
                    },
                    roomBackgroundImageUrl: {
                        set: { isAllowed: true, isSupported: true },
                        reset: { isAllowed: true, isSupported: true },
                    },
                    roomKnockPageBackgroundImageUrl: {
                        set: { isAllowed: true, isSupported: true },
                        reset: { isAllowed: true, isSupported: true },
                    },
                },
                invitations: {
                    add: { isAllowed: true, isSupported: true },
                    delete: { isAllowed: true, isSupported: true },
                    list: { isAllowed: true, isSupported: true },
                },
                roles: {
                    set: { isAllowed: true, isSupported: true },
                    remove: { isAllowed: true, isSupported: true },
                    removeSelf: { isAllowed: true, isSupported: true },
                    list: { isAllowed: true, isSupported: true },
                },
                users: {
                    signUpWithoutInvitation: { isAllowed: true, isSupported: true },
                },
            };
            const properties = {
                organizationId,
                organizationName,
                subdomain,
                account,
                permissions,
                limits,
                logoImageUrl,
                roomBackgroundImageUrl,
                roomBackgroundThumbnailUrl,
                roomKnockPageBackgroundImageUrl,
                roomKnockPageBackgroundThumbnailUrl,
                preferences,
                onboardingSurvey,
                type,
            };
            const organization = new Organization(properties);
            const expectedObj = Object.assign({}, defaultOrganization, properties);

            expect(organization).toEqual(expectedObj);
        });

        it(
            "should instantiate an Account object if account information is provided",
            () => {
                const permissions = {
                    rooms: {
                        changeTypeToPersonal: { isAllowed: true, isSupported: true },
                        changeTypeToPersonalXl: { isAllowed: true, isSupported: true },
                        customize: { isAllowed: true, isSupported: true },
                        customizeSelf: { isAllowed: true, isSupported: true },
                        list: { isAllowed: true, isSupported: true },
                        lock: { isAllowed: true, isSupported: true },
                        unclaim: { isAllowed: true, isSupported: true },
                        unclaimSelf: { isAllowed: true, isSupported: true },
                    },
                    subscriptions: {
                        add: { isAllowed: true, isSupported: true },
                        list: { isAllowed: true, isSupported: true },
                        payLatestInvoice: { isAllowed: true, isSupported: true },
                        updatePlan: { isAllowed: true, isSupported: true },
                    },
                    browserExtension: {
                        install: { isAllowed: true, isSupported: true },
                    },
                };
                const properties = {
                    account: {
                        basePlanId: "some-base-plan-id",
                        isDeactivated: false,
                        onTrialUntil: null,
                        isOnTrial: false,
                        trialStatus: "some-status",
                        embeddedFreeTierStatus: null,
                    },
                    organizationId,
                    organizationName,
                    subdomain,
                    permissions,
                    limits,
                    logoImageUrl,
                    roomBackgroundImageUrl,
                    roomBackgroundThumbnailUrl,
                    roomKnockPageBackgroundImageUrl,
                    roomKnockPageBackgroundThumbnailUrl,
                    preferences,
                    onboardingSurvey,
                    type,
                };
                const organization = new Organization(properties);

                expect(organization.account).toBeInstanceOf(Account);
            }
        );
    });

    describe("GLOBAL_ORGANIZATION_ID", () => {
        it("should be 1", () => {
            expect(Organization.GLOBAL_ORGANIZATION_ID).toBe("1");
        });
    });

    describe("hasValue", () => {
        it("should return true when value is 0", () => {
            expect(hasValue(0)).toBe(true);
        });

        it(`should return true when value is "0"`, () => {
            expect(hasValue("0")).toBe(true);
        });

        it("should return false when value is undefined", () => {
            expect(hasValue(undefined)).toBe(false);
        });

        it("should return false when value is null", () => {
            expect(hasValue(null)).toBe(false);
        });
    });
});
