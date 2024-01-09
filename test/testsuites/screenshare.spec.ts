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

        test("screen share is visible", async ({ page }) => {
            const participant1 = page;
            await joinRoom({ page, roomUrl });

            const participant2 = await page.context().newPage();
            await joinRoom({ page: participant2, roomUrl });

            // participant1 starts screen share
            await participant1.click('[data-testid="startScreenshareBtn"]');

            // participant1 sees its own screen share
            await expect(participant1.getByTestId("screenShare")).toHaveCount(1);
            await expect(participant1.getByTestId("screenShare")).toHaveJSProperty("readyState", 4);

            // participant2 sees participant1's screen share
            await expect(participant2.getByTestId("screenShare")).toHaveCount(1);
            await expect(participant2.getByTestId("screenShare")).toHaveJSProperty("readyState", 4);

            // participant1 stops screen share
            await participant1.click('[data-testid="stopScreenshareBtn"]');

            // screen share is not visible anymore
            await expect(participant1.getByTestId("screenShare")).toHaveCount(0);
            await expect(participant2.getByTestId("screenShare")).toHaveCount(0);
        });
    });
});
