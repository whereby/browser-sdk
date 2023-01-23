import { expect } from "chai";

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

                const result = Account.fromJson({
                    basePlanId,
                    isDeactivated,
                    isOnTrial,
                    onTrialUntil,
                    trialStatus,
                    embeddedFreeTierStatus,
                });

                // @ts-ignore
                expect(result)
                    .to.be.an.instanceOf(Account)
                    .and.to.deep.equal(
                        new Account({
                            basePlanId,
                            isDeactivated,
                            isOnTrial,
                            onTrialUntil: new Date(onTrialUntil),
                            trialStatus,
                            embeddedFreeTierStatus: EmbeddedFreeTierStatus.fromJson(embeddedFreeTierStatus),
                        })
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

                const result = Account.fromJson({
                    basePlanId,
                    isDeactivated,
                    isOnTrial,
                    onTrialUntil,
                    trialStatus,
                });

                // @ts-ignore
                expect(result)
                    .to.be.an.instanceOf(Account)
                    .and.to.deep.equal(
                        new Account({
                            basePlanId,
                            isDeactivated,
                            isOnTrial,
                            onTrialUntil: new Date(onTrialUntil),
                            trialStatus,
                            embeddedFreeTierStatus: null,
                        })
                    );
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

                const result = Account.fromJson({
                    embeddedFreeTierStatus,
                    isDeactivated,
                    isOnTrial,
                    onTrialUntil,
                    trialStatus,
                });

                // @ts-ignore
                expect(result)
                    .to.be.an.instanceOf(Account)
                    .and.to.deep.equal(
                        new Account({
                            basePlanId: null,
                            isDeactivated,
                            isOnTrial,
                            onTrialUntil: new Date(onTrialUntil),
                            trialStatus,
                            embeddedFreeTierStatus: EmbeddedFreeTierStatus.fromJson(embeddedFreeTierStatus),
                        })
                    );
            });
        });
    });
});
