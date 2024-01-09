import Account from "../Account";
import EmbeddedFreeTierStatus from "../account/EmbeddedFreeTierStatus";

describe("Account", () => {
    describe("fromJson", () => {
        describe("when embeddedFreeTierStatus is provided", () => {
            it("should return an instance of Account with the right values", () => {
                const basePlanId = "some-base-plan-id";
                const isDeactivated = false;
                const isOnTrial = true;
                const onTrialUntil = "09-02-2022";
                const trialStatus = "some-status";
                const embeddedFreeTierStatus = {
                    isExhausted: false,
                    renewsAt: "23-02-2022",
                    totalMinutesLimit: 1000,
                    totalMinutesUsed: 700,
                };
                const embeddedFreeTierStatusFromJson = EmbeddedFreeTierStatus.fromJson(embeddedFreeTierStatus);
                const expectedAccount = new Account({
                    basePlanId,
                    isDeactivated,
                    isOnTrial,
                    onTrialUntil: new Date(onTrialUntil),
                    trialStatus,
                    embeddedFreeTierStatus: embeddedFreeTierStatusFromJson,
                });

                const result = Account.fromJson({
                    basePlanId,
                    isDeactivated,
                    isOnTrial,
                    onTrialUntil,
                    trialStatus,
                    embeddedFreeTierStatus,
                });

                expect(result).toBeInstanceOf(Account);
                expect(result.basePlanId).toEqual(expectedAccount.basePlanId);
                expect(result.isDeactivated).toEqual(expectedAccount.isDeactivated);
                expect(result.isOnTrial).toEqual(expectedAccount.isOnTrial);
                expect(result.onTrialUntil).toEqual(expectedAccount.onTrialUntil);
                expect(result.trialStatus).toEqual(expectedAccount.trialStatus);
                expect(JSON.stringify(result.embeddedFreeTierStatus)).toEqual(
                    JSON.stringify(embeddedFreeTierStatusFromJson)
                );
            });
        });

        describe("when embeddedFreeTierStatus is not provided", () => {
            it("should return an instance of Account with embeddedFreeTierStatus as null", () => {
                const basePlanId = "some-base-plan-id";
                const isDeactivated = false;
                const isOnTrial = true;
                const onTrialUntil = "09-02-2022";
                const trialStatus = "some-status";
                const expectedAccount = new Account({
                    basePlanId,
                    isDeactivated,
                    isOnTrial,
                    onTrialUntil: new Date(onTrialUntil),
                    trialStatus,
                    embeddedFreeTierStatus: null,
                });

                const result = Account.fromJson({
                    basePlanId,
                    isDeactivated,
                    isOnTrial,
                    onTrialUntil,
                    trialStatus,
                });

                // @ts-ignore
                expect(result).toBeInstanceOf(Account);
                expect(result.basePlanId).toEqual(expectedAccount.basePlanId);
                expect(result.isDeactivated).toEqual(expectedAccount.isDeactivated);
                expect(result.isOnTrial).toEqual(expectedAccount.isOnTrial);
                expect(result.onTrialUntil).toEqual(expectedAccount.onTrialUntil);
                expect(result.trialStatus).toEqual(expectedAccount.trialStatus);
                expect(result.embeddedFreeTierStatus).toEqual(null);
            });
        });

        describe("when basePlanId is not provided", () => {
            it("should return an Account with basePlanId set to null", () => {
                const isDeactivated = false;
                const isOnTrial = true;
                const onTrialUntil = "09-02-2022";
                const trialStatus = "some-status";
                const embeddedFreeTierStatus = {
                    isExhausted: false,
                    renewsAt: "23-02-2022",
                    totalMinutesLimit: 1000,
                    totalMinutesUsed: 700,
                };
                const embeddedFreeTierStatusFromJson = EmbeddedFreeTierStatus.fromJson(embeddedFreeTierStatus);
                const expectedAccount = new Account({
                    basePlanId: null,
                    isDeactivated,
                    isOnTrial,
                    onTrialUntil: new Date(onTrialUntil),
                    trialStatus,
                    embeddedFreeTierStatus: embeddedFreeTierStatusFromJson,
                });

                const result = Account.fromJson({
                    embeddedFreeTierStatus,
                    isDeactivated,
                    isOnTrial,
                    onTrialUntil,
                    trialStatus,
                });

                // @ts-ignore
                expect(result).toBeInstanceOf(Account);
                expect(result.basePlanId).toEqual(expectedAccount.basePlanId);
                expect(result.isDeactivated).toEqual(expectedAccount.isDeactivated);
                expect(result.isOnTrial).toEqual(expectedAccount.isOnTrial);
                expect(result.onTrialUntil).toEqual(expectedAccount.onTrialUntil);
                expect(result.trialStatus).toEqual(expectedAccount.trialStatus);
                expect(JSON.stringify(result.embeddedFreeTierStatus)).toEqual(
                    JSON.stringify(embeddedFreeTierStatusFromJson)
                );
            });
        });
    });
});
