import { test, expect } from "@playwright/test";
import { createTransientRoom, deleteTransientRoom, joinRoom, RoomMode } from "./utils/room";

const roomModes: RoomMode[] = ["normal", "group"];

roomModes.forEach((roomMode) => {
    test.describe(`roomMode: ${roomMode}`, () => {
        let meetingId: string;
        let roomUrl: string;

        test.beforeAll(async () => {
            ({ meetingId, roomUrl } = await createTransientRoom({
                isLocked: false,
                roomMode,
            }));
        });

        test.afterAll(async () => {
            await deleteTransientRoom(meetingId);
        });

        test("send/receive message", async ({ page }) => {
            const participant1 = page;
            await joinRoom({ page, roomUrl });
            const participant1ClientId = await participant1.getByTestId("localClientId").textContent();

            const participant2 = await page.context().newPage();
            await joinRoom({ page: participant2, roomUrl });

            await expect(participant1.getByTestId("chatMessages")).toContainText("No chat messages");
            await expect(participant2.getByTestId("chatMessages")).toContainText("No chat messages");

            await participant1.getByTestId("chatInput").fill("Hello Whereby!");
            await participant1.getByTestId("sendChatMessageBtn").click();

            await expect(participant1.getByTestId("chatMessages")).toContainText(
                `${participant1ClientId}: Hello Whereby!`
            );
            await expect(participant2.getByTestId("chatMessages")).toContainText(
                `${participant1ClientId}: Hello Whereby!`
            );
        });
    });
});
