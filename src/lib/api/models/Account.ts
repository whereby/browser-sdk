import { assertBoolean } from "../parameterAssertUtils";
import EmbeddedFreeTierStatus from "./account/EmbeddedFreeTierStatus";

interface AccountProps {
    basePlanId: string | null;
    isDeactivated: boolean;
    isOnTrial: boolean;
    onTrialUntil: Date | null;
    trialStatus: string | null;
    embeddedFreeTierStatus: EmbeddedFreeTierStatus | null;
}
export default class Account {
    basePlanId: string | null;
    embeddedFreeTierStatus: EmbeddedFreeTierStatus | null;
    isDeactivated: boolean;
    isOnTrial: boolean;
    onTrialUntil: Date | null;
    trialStatus: string | null;

    constructor({
        basePlanId,
        embeddedFreeTierStatus,
        isDeactivated,
        isOnTrial,
        onTrialUntil,
        trialStatus,
    }: AccountProps) {
        this.basePlanId = basePlanId;
        this.isDeactivated = isDeactivated;
        this.isOnTrial = isOnTrial;
        this.onTrialUntil = onTrialUntil || null;
        this.trialStatus = trialStatus || null;
        this.embeddedFreeTierStatus = embeddedFreeTierStatus || null;
    }

    static fromJson(data: Record<string, unknown>): Account {
        return new Account({
            basePlanId: typeof data.basePlanId === "string" ? data.basePlanId : null,
            isDeactivated: assertBoolean(data.isDeactivated, "isDeactivated"),
            isOnTrial: assertBoolean(data.isOnTrial, "isOnTrial"),
            onTrialUntil: typeof data.onTrialUntil === "string" ? new Date(data.onTrialUntil) : null,
            trialStatus: typeof data.trialStatus === "string" ? data.trialStatus : null,
            embeddedFreeTierStatus: data.embeddedFreeTierStatus
                ? EmbeddedFreeTierStatus.fromJson(data.embeddedFreeTierStatus as Record<string, unknown>)
                : null,
        });
    }
}
