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

        test("can toggle audio", async ({ page }) => {
            const participant1 = page;
            await joinRoom({ page, roomUrl, withFakeAudioStream: true });

            const participant2 = await page.context().newPage();
            await joinRoom({ page: participant2, roomUrl, withFakeAudioStream: true });

            await expect(participant1.getByTestId("remoteParticipantVideo")).toHaveCount(1);
            await expect(participant2.getByTestId("remoteParticipantVideo")).toHaveCount(1);

            await expect(participant1.getByTestId("remoteParticipantAudioStatus")).toContainText("Audio is on");
            await expect(participant2.getByTestId("remoteParticipantAudioStatus")).toContainText("Audio is on");

            // Participant 1 mutes itself
            await participant1.click('[data-testid="toggleMicrophoneBtn"]');
            // Participant 2 should see participant 1 muted
            await expect(participant2.getByTestId("remoteParticipantAudioStatus")).toContainText("Audio is off");

            // Participant 2 mutes itself
            await participant2.click('[data-testid="toggleMicrophoneBtn"]');
            // Participant 1 should see participant 2 muted
            await expect(participant1.getByTestId("remoteParticipantAudioStatus")).toContainText("Audio is off");

            // Participant 1 unmutes itself
            await participant1.click('[data-testid="toggleMicrophoneBtn"]');
            // Participant 2 should see participant 1 unmuted
            await expect(participant2.getByTestId("remoteParticipantAudioStatus")).toContainText("Audio is on");

            // Participant 2 unmutes itself
            await participant2.click('[data-testid="toggleMicrophoneBtn"]');
            // Participant 1 should see participant 2 unmuted
            await expect(participant1.getByTestId("remoteParticipantAudioStatus")).toContainText("Audio is on");
        });

        test("can toggle video", async ({ page }) => {
            const participant1 = page;
            await joinRoom({ page, roomUrl, withFakeAudioStream: true });

            const participant2 = await page.context().newPage();
            await joinRoom({ page: participant2, roomUrl, withFakeAudioStream: true });

            await expect(participant1.getByTestId("remoteParticipantVideo")).toHaveCount(1);
            await expect(participant2.getByTestId("remoteParticipantVideo")).toHaveCount(1);

            // Participant 1 turns camera off
            await participant1.click('[data-testid="toggleCameraBtn"]');
            await expect(participant1.getByTestId("localParticipant")).toContainText("Your camera is off");
            // Participant 2 should see participant 1 with camera off
            await expect(participant2.getByTestId("remoteParticipantVideo")).toHaveCount(0);
            await expect(participant2.getByTestId("remoteParticipant")).toContainText("Participant's camera is off");

            // Participant 2 turns camera off
            await participant2.click('[data-testid="toggleCameraBtn"]');
            await expect(participant2.getByTestId("localParticipant")).toContainText("Your camera is off");
            // Participant 1 should see participant 2 with camera off
            await expect(participant1.getByTestId("remoteParticipantVideo")).toHaveCount(0);
            await expect(participant1.getByTestId("remoteParticipant")).toContainText("Participant's camera is off");

            // Participant 1 turns camera on again
            await participant1.click('[data-testid="toggleCameraBtn"]');
            await expect(participant1.getByTestId("localParticipant").locator("video")).toHaveCount(1);
            // Participant 2 should see participant 1 with camera on
            await expect(participant2.getByTestId("remoteParticipantVideo")).toHaveCount(1);
            await expect(participant2.getByTestId("remoteParticipant")).not.toContainText(
                "Participant's camera is off"
            );

            // Participant 2 turns camera on again
            await participant2.click('[data-testid="toggleCameraBtn"]');
            await expect(participant2.getByTestId("localParticipant").locator("video")).toHaveCount(1);
            // Participant 1 should see participant 2 with camera on
            await expect(participant1.getByTestId("remoteParticipantVideo")).toHaveCount(1);
            await expect(participant1.getByTestId("remoteParticipant")).not.toContainText(
                "Participant's camera is off"
            );
        });
    });
});
