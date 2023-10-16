# Browser-SDK e2e testing

These tests are executed on CI as described in
`.github/workflows/playwright.yml`.

The tests utilize a sample React app with a freshly built browser-sdk.

## Running the tests locally

1. Install the dependencies for the browser-sdk.
    ```sh
    yarn install
    ```
2. Install the dependencies for the sample app.
    ```sh
    yarn install:e2e-sample-app
    ```
3. Install tests browsers
    ```sh
    yarn playwright install --with-deps
    ```
4. Run the tests.
    ```sh
    WHEREBY_API_KEY=<your-api-key> yarn test:e2e
    ```

Optionally, you can add a `--ui` flag at the end of the command to run/debug
tests using [Playwright's UI](https://playwright.dev/docs/test-ui-mode).

To run tests against local-stack, you can specify the signal and API server
endpoints as environment variables:

```sh
REACT_APP_API_BASE_URL=<api-base-url> \
REACT_APP_SIGNAL_BASE_URL=<signal-base-url> \
WHEREBY_API_KEY=<local-api-key> \
yarn test:e2e
```

## Debugging CI test failures

Test reports are attached to each test in GitHub Actions. These reports contain
traces when a test fails. You can download these traces and inspect the
timeline locally to see the network requests, console messages, and errors.

1. Download and unzip the report.
2. Start Playwright's Trace viewer
    ```
    npx playwright show-trace data/<test-data-id>.zip
    ```
