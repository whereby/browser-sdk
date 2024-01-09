import { test, expect } from "@playwright/test";
import { createTransientRoom, deleteTransientRoom, joinRoom } from "./utils/room";

test.describe("unlocked room", () => {
    let meetingId: string;
    let roomUrl: string;

    test.beforeAll(async () => {
        ({ meetingId, roomUrl } = await createTransientRoom({
            isLocked: false,
            roomMode: "normal",
        }));
    });

    test.afterAll(async () => {
        await deleteTransientRoom(meetingId);
    });

    test("join room", async ({ page }) => {
        await joinRoom({ page, roomUrl });

        await expect(page.locator("h1")).toContainText(/Room/);
        await expect(page.locator("dd[data-testid='connectionStatus']")).toContainText("connected");
    });
});
