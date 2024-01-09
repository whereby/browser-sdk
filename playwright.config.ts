import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from "dotenv";
dotenv.config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: "./test",
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Use 80% of logical CPU cores on CI. */
    workers: process.env.CI ? "80%" : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: "html",
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        // baseURL: 'http://127.0.0.1:3000',

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: "on-first-retry",
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
                launchOptions: {
                    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
                },
            },
        },

        {
            name: "firefox",
            use: {
                ...devices["Desktop Firefox"],
                launchOptions: {
                    firefoxUserPrefs: {
                        "media.navigator.streams.fake": true,
                        "media.navigator.permission.disabled": true,
                    },
                },
            },
        },

        {
            name: "webkit",
            use: {
                ...devices["Desktop Safari"],
            },
        },
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: "PORT=3001 yarn start:e2e-sample-app",
        url: "http://127.0.0.1:3001",
        reuseExistingServer: !process.env.CI,
        stdout: "ignore",
        stderr: "pipe",
    },
});
