import { assertBoolean, assertNumber, assertString } from "../../parameterAssertUtils";

export default class EmbeddedFreeTierStatus {
    isExhausted: boolean;
    renewsAt: Date;
    totalMinutesLimit: number;
    totalMinutesUsed: number;

    constructor({
        isExhausted,
        renewsAt,
        totalMinutesLimit,
        totalMinutesUsed,
    }: {
        isExhausted: boolean;
        renewsAt: Date;
        totalMinutesLimit: number;
        totalMinutesUsed: number;
    }) {
        this.isExhausted = isExhausted;
        this.renewsAt = renewsAt;
        this.totalMinutesLimit = totalMinutesLimit;
        this.totalMinutesUsed = totalMinutesUsed;
    }

    static fromJson(data: Record<string, unknown>): EmbeddedFreeTierStatus {
        return new EmbeddedFreeTierStatus({
            isExhausted: assertBoolean(data.isExhausted, "isExhausted"),
            renewsAt: new Date(assertString(data.renewsAt, "renewsAt")),
            totalMinutesLimit: assertNumber(data.totalMinutesLimit, "totalMinutesLimit"),
            totalMinutesUsed: assertNumber(data.totalMinutesUsed, "totalMinutesUsed"),
        });
    }
}
