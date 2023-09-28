import { test, expect } from "@playwright/test";

test("connect room", async ({ page }) => {
    const roomUrl = process.env.REACT_APP_SMALL_ROOM_HOST_URL;
    if (!roomUrl) {
        throw new Error("REACT_APP_SMALL_ROOM_HOST_URL not set");
    }
    await page.goto("http://127.0.0.1:3001");
    const locator = page.locator("h1");
    await expect(locator).toContainText(/Enter room URL/);

    const input = page.locator("input");
    await input.fill(roomUrl);
    await page.click("button");

    await expect(page.locator("h1")).toContainText(/Room/);
    await expect(page.locator("dd[data-testid='roomConnectionStatus']")).toContainText("connected");
});
