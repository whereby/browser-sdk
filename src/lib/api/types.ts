export type UserConsentAction = "accepted" | "rejected" | null;
export type ConsentGrantRequest = {
    readonly consentRevisionId: string;
    readonly action: UserConsentAction;
};

