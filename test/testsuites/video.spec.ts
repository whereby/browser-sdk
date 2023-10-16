import { test, expect } from "@playwright/test";
import { createTransientRoom, deleteTransientRoom, joinRoom, RoomMode } from "./utils/room";
import { getAudioTrackPropertiesFromHTMLVideoElement } from "./utils/media";

const roomModes: RoomMode[] = ["normal", "group"];

roomModes.forEach((roomMode) => {
    test.describe(`roomMode: ${roomMode}`, () => {
        let meetingId: string;
        let roomUrl: string;

        test.beforeEach(async () => {
            ({ meetingId, roomUrl } = await createTransientRoom({
                isLocked: false,
                roomMode,
            }));
        });

        test.afterEach(async () => {
            await deleteTransientRoom(meetingId);
        });

        test("gets remote participant's stream", async ({ page }) => {
            const participant1 = page;
            await joinRoom({ page, roomUrl, withFakeAudioStream: true });

            const participant2 = await page.context().newPage();
            await joinRoom({ page: participant2, roomUrl });

            await expect(participant1.getByTestId("remoteParticipant")).toHaveCount(1);
            await expect(participant2.getByTestId("remoteParticipant")).toHaveCount(1);

            // 4 = HAVE_ENOUGH_DATA - It tells that there is enough data available to start playing.
            await expect(participant1.getByTestId("remoteParticipant")).toHaveJSProperty("readyState", 4);
            await expect(participant2.getByTestId("remoteParticipant")).toHaveJSProperty("readyState", 4);

            await expect(participant1.getByTestId("remoteParticipant")).toHaveJSProperty("muted", false);

            // check audio track
            const participant2AudioTrackProperties = await participant2
                .getByTestId("remoteParticipant")
                .evaluate(getAudioTrackPropertiesFromHTMLVideoElement);
            expect(participant2AudioTrackProperties).toHaveProperty("readyState", "live");
            expect(participant2AudioTrackProperties).toHaveProperty("kind", "audio");
            expect(participant2AudioTrackProperties).toHaveProperty("muted", false);
            expect(participant2AudioTrackProperties).toHaveProperty("enabled", true);
            await expect(participant2.getByTestId("remoteParticipant")).toHaveJSProperty("muted", false);
        });
    });
});
