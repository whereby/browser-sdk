import { test, expect } from "@playwright/test";
import { createTransientRoom, deleteTransientRoom, joinRoom, RoomMode } from "./utils/room";

const roomModes: RoomMode[] = ["normal", "group"];

roomModes.forEach((roomMode) => {
    test.describe(`roomMode: ${roomMode}`, () => {
        let meetingId: string;
        let roomUrl: string;
        let hostRoomUrl: string;

        test.beforeAll(async () => {
            ({ meetingId, roomUrl, hostRoomUrl } = await createTransientRoom({
                isLocked: true,
                roomMode,
            }));
        });

        test.afterAll(async () => {
            await deleteTransientRoom(meetingId);
        });

        test("host joins => guest knocks => accept", async ({ page }) => {
            const host = page;
            await joinRoom({ page, roomUrl: hostRoomUrl });
            await expect(host.getByTestId("knockRequest")).toHaveCount(0);

            const guest = await page.context().newPage();
            await joinRoom({ page: guest, roomUrl, expectLockScreen: true });

            await guest.getByRole("button", { name: "Knock" }).click();
            await expect(guest.getByTestId("connectionStatus")).toContainText("knocking");
            await expect(host.getByTestId("knockRequest")).toHaveCount(1);

            await host.getByTestId("knockRequest").getByRole("button", { name: "Let in" }).click();
            await expect(host.getByTestId("knockRequest")).toHaveCount(0);
            await expect(host.getByTestId("remoteParticipantVideo")).toHaveCount(1);

            await expect(guest.getByTestId("connectionStatus")).toContainText("connected");
            await expect(guest.getByTestId("remoteParticipantVideo")).toHaveCount(1);
        });

        test("guest knocks => host joins => accept", async ({ page }) => {
            const guest = await page.context().newPage();
            await joinRoom({ page: guest, roomUrl, expectLockScreen: true });

            await guest.getByRole("button", { name: "Knock" }).click();
            await expect(guest.getByTestId("connectionStatus")).toContainText("knocking");

            const host = page;
            await joinRoom({ page, roomUrl: hostRoomUrl });
            await expect(host.getByTestId("knockRequest")).toHaveCount(1);

            await host.getByTestId("knockRequest").getByRole("button", { name: "Let in" }).click();
            await expect(host.getByTestId("knockRequest")).toHaveCount(0);
            await expect(host.getByTestId("remoteParticipantVideo")).toHaveCount(1);

            await expect(guest.getByTestId("connectionStatus")).toContainText("connected");
            await expect(guest.getByTestId("remoteParticipantVideo")).toHaveCount(1);
        });

        test("reject", async ({ page }) => {
            const host = page;
            await joinRoom({ page, roomUrl: hostRoomUrl });
            await expect(host.getByTestId("knockRequest")).toHaveCount(0);

            const guest = await page.context().newPage();
            await joinRoom({ page: guest, roomUrl, expectLockScreen: true });

            await guest.getByRole("button", { name: "Knock" }).click();
            await expect(guest.getByTestId("connectionStatus")).toContainText("knocking");
            await expect(host.getByTestId("knockRequest")).toHaveCount(1);

            await host.getByTestId("knockRequest").getByRole("button", { name: "Reject" }).click();
            await expect(host.getByTestId("knockRequest")).toHaveCount(0);
            await expect(host.getByTestId("remoteParticipantVideo")).toHaveCount(0);

            await expect(guest.getByTestId("knockRejectedMessage")).toHaveCount(1);
            await expect(guest.getByTestId("remoteParticipantVideo")).toHaveCount(0);
        });

        test("knocker leaves before knock handled", async ({ page }) => {
            const host = page;
            await joinRoom({ page, roomUrl: hostRoomUrl });
            await expect(host.getByTestId("knockRequest")).toHaveCount(0);

            const guest = await page.context().newPage();
            await joinRoom({ page: guest, roomUrl, expectLockScreen: true });

            await guest.getByRole("button", { name: "Knock" }).click();
            await expect(guest.getByTestId("connectionStatus")).toContainText("knocking");
            await expect(host.getByTestId("knockRequest")).toHaveCount(1);

            await guest.close();
            await expect(host.getByTestId("knockRequest")).toHaveCount(0);
            await expect(host.getByTestId("remoteParticipantVideo")).toHaveCount(0);
        });
    });
});
