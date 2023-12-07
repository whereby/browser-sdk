// Expects injected CSS properties onto :root that map the env safe area inset values
// :root {
//    /* Map the env safe area inset values because we can't directly read env values from JS */
//     --safe-area-inset-top: env(safe-area-inset-top, 0);
//     --safe-area-inset-right: env(safe-area-inset-right, 0);
//     --safe-area-inset-bottom: env(safe-area-inset-bottom, 0);
//     --safe-area-inset-left: env(safe-area-inset-left, 0);
// }

export function captureSafeAreaInsets() {
    const rootStyles = window && window.getComputedStyle(document.documentElement);
    const getPropertyValue = (property: string) =>
        (rootStyles && parseInt(rootStyles.getPropertyValue(property), 10)) || 0;

    return {
        top: getPropertyValue("--safe-area-inset-top"),
        right: getPropertyValue("--safe-area-inset-right"),
        bottom: getPropertyValue("--safe-area-inset-bottom"),
        left: getPropertyValue("--safe-area-inset-left"),
    };
}
