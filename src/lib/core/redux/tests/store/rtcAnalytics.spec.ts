import { createStore, mockRtcManager } from "../store.setup";
import { doRtcAnalyticsCustomEventsInitialize, rtcAnalyticsState } from "../../slices/rtcAnalytics";
import { diff } from "deep-object-diff";

describe("actions", () => {
    it("doRtcAnalyticsCustomEventsInitialize", async () => {
        const store = createStore({ withRtcManager: true });

        const before = store.getState().rtcAnalytics;

        store.dispatch(doRtcAnalyticsCustomEventsInitialize());

        const after = store.getState().rtcAnalytics;

        const updatedState = diff(before, after) as rtcAnalyticsState;

        expect(Object.keys(updatedState?.reportedValues)).toEqual(
            expect.arrayContaining([
                "audioEnabled",
                "videoEnabled",
                "localScreenshareStream",
                "displayName",
                "clientId",
                "externalId",
                "signalConnectionStatus",
                "rtcConnectionStatus",
                "userRole",
            ])
        );
        expect(mockRtcManager.sendStatsCustomEvent).toHaveBeenCalledWith("insightsStats", expect.any(Object));
    });
});
