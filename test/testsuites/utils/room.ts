import { request } from "playwright";
import { expect, Page } from "@playwright/test";

export type RoomMode = "normal" | "group";
type RoomConfig = {
    isLocked: boolean;
    roomMode: RoomMode;
};
type TransientRoom = {
    roomUrl: string;
    hostRoomUrl: string;
    meetingId: string;
};

async function createTransientRoom({ isLocked, roomMode }: RoomConfig): Promise<TransientRoom> {
    const apiKey = process.env.WHEREBY_API_KEY;
    const endpoint = process.env.REACT_APP_API_BASE_URL
        ? `${process.env.REACT_APP_API_BASE_URL}/v1/meetings`
        : "https://api.whereby.dev/v1/meetings";

    if (!apiKey) {
        throw new Error("WHEREBY_API_KEY not set");
    }

    const apiRequestContext = await request.newContext();

    const response = await apiRequestContext.fetch(endpoint, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        data: {
            isLocked,
            roomMode,
            roomNamePrefix: "browser-sdk-e2e-test-",
            // 30 minutes from now
            endDate: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
            fields: ["hostRoomUrl"],
            recording: {
                type: "none",
                destination: {},
            },
        },
    });

    if (!response.ok()) {
        throw new Error(`createTransientRoom failed with status ${response.status()}`);
    }

    const { roomUrl, hostRoomUrl, meetingId } = await response.json();
    return { roomUrl, hostRoomUrl, meetingId };
}

async function deleteTransientRoom(meetingId: string) {
    if (!meetingId) {
        console.warn("[WARN] deleteTransientRoom called with empty meetingId");
        return;
    }

    const apiKey = process.env.WHEREBY_API_KEY;
    const endpoint = process.env.REACT_APP_API_BASE_URL
        ? `${process.env.REACT_APP_API_BASE_URL}/v1/meetings/${meetingId}`
        : `https://api.whereby.dev/v1/meetings/${meetingId}`;

    if (!apiKey) {
        throw new Error("WHEREBY_API_KEY not set");
    }

    const apiRequestContext = await request.newContext();

    const response = await apiRequestContext.fetch(endpoint, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${apiKey}`,
        },
    });

    if (!response.ok()) {
        throw new Error(`deleteTransientRoom failed with status ${response.status()}`);
    }

    return;
}

async function joinRoom(page: Page, roomUrl: string) {
    await page.goto("http://127.0.0.1:3001");
    const locator = page.locator("h1");
    await expect(locator).toContainText(/Enter room URL/);

    const input = page.locator("input");
    await input.fill(roomUrl);
    await page.click("button");

    await expect(page.locator("h1")).toContainText(/Room/);
    await expect(page.locator("dd[data-testid='roomConnectionStatus']")).toContainText("connected");
}

export { createTransientRoom, deleteTransientRoom, joinRoom };
