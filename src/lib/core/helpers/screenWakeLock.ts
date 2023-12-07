import { AppDispatch } from "../redux/store";

interface WakeLockSentinal extends EventTarget {
    type: string;
    released: boolean;
    release(): void;
}
interface WakeLockNavigator {
    wakeLock: {
        request(type: string): Promise<WakeLockSentinal>;
    };
}

/**
 * Request a wake lock for the screen to prevent the screen from turning off
 *
 * @param {function} dispatch
 * @returns {Promise<null|WakeLockSentinel>}
 */
export async function requestWakeLock(dispatch: AppDispatch) {
    if ("wakeLock" in navigator) {
        try {
            const wakeLock = await (navigator as WakeLockNavigator)?.wakeLock.request("screen");
            wakeLock.addEventListener("release", () => {
                // Use setTimeout to avoid site crashing when dispatching an
                // action on a background tab
                setTimeout(() => dispatch({ type: "WAKE_LOCK_RELEASED" }), 0);
            });

            dispatch({ type: "WAKE_LOCK_ACTIVATED", payload: wakeLock });

            return wakeLock;
        } catch (err) {
            // ignore error
        }
    }
    return null;
}
