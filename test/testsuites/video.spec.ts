import { test, expect } from "@playwright/test";
import { createTransientRoom, deleteTransientRoom, joinRoom, RoomMode } from "./utils/room";
import {
    countFrames,
    CountFramesFunction,
    getAudioTrackPropertiesFromHTMLVideoElement,
    makeFrameStatistics,
} from "./utils/media";

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

        test("gets remote participant's stream", async ({ page }) => {
            const participant1 = page;
            await joinRoom({ page, roomUrl, withFakeAudioStream: true });

            const participant2 = await page.context().newPage();
            await joinRoom({ page: participant2, roomUrl });

            await expect(participant1.getByTestId("remoteParticipantVideo")).toHaveCount(1);
            await expect(participant2.getByTestId("remoteParticipantVideo")).toHaveCount(1);

            // 4 = HAVE_ENOUGH_DATA - It tells that there is enough data available to start playing.
            await expect(participant1.getByTestId("remoteParticipantVideo")).toHaveJSProperty("readyState", 4);
            await expect(participant2.getByTestId("remoteParticipantVideo")).toHaveJSProperty("readyState", 4);

            await expect(participant1.getByTestId("remoteParticipantVideo")).toHaveJSProperty("muted", false);

            // check audio track
            const participant2AudioTrackProperties = await participant2
                .getByTestId("remoteParticipantVideo")
                .evaluate(getAudioTrackPropertiesFromHTMLVideoElement);
            expect(participant2AudioTrackProperties).toHaveProperty("readyState", "live");
            expect(participant2AudioTrackProperties).toHaveProperty("kind", "audio");
            expect(participant2AudioTrackProperties).toHaveProperty("muted", false);
            expect(participant2AudioTrackProperties).toHaveProperty("enabled", true);
            await expect(participant2.getByTestId("remoteParticipantVideo")).toHaveJSProperty("muted", false);
        });

        test("video is not frozen", async ({ page, browserName }) => {
            test.skip(browserName === "webkit", "Webkit does not have an API to get video frame stats.");

            const participant1 = page;
            await joinRoom({ page, roomUrl });

            const participant2 = await page.context().newPage();
            await joinRoom({ page: participant2, roomUrl });

            // 4 = HAVE_ENOUGH_DATA - It tells that there is enough data available to start playing.
            await expect(participant1.getByTestId("remoteParticipantVideo")).toHaveJSProperty("readyState", 4);
            await expect(participant2.getByTestId("remoteParticipantVideo")).toHaveJSProperty("readyState", 4);

            const countFramesHandle = await page.evaluateHandle(`${countFrames}`);
            const participant1Samples = await participant1
                .getByTestId("remoteParticipantVideo")
                .evaluate((element: HTMLVideoElement, countFramesFn) => {
                    const countFrames = countFramesFn as CountFramesFunction;
                    // counts 10 samples in a 1000ms interval.
                    return countFrames(element, 1000, 10);
                }, countFramesHandle);
            const participant1FrameStatistics = makeFrameStatistics(participant1Samples);

            expect(participant1FrameStatistics.minFps).toBeGreaterThan(1);
        });
    });
});
