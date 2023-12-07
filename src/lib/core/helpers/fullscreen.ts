/**
 * Simple helper to get and set browser fullscreen state
 */

export const isFullscreenSupported = () =>
    !!(window.document.fullscreenEnabled || (window.document as any).webkitFullscreenEnabled);

export const isBrowserFullscreen = () =>
    !!(window.document.fullscreenElement || (window.document as any).webkitFullscreenElement);

export const exitBrowserFullscreen = () => {
    const exitFullscreenFn = window.document.exitFullscreen || (window.document as any).webkitExitFullscreen;
    if (exitFullscreenFn) {
        exitFullscreenFn.call(window.document);
    }
};

export const enterBrowserFullscreen = ({ onError = console.error, el = window.document.documentElement } = {}) => {
    const requestFullscreenFn = el.requestFullscreen || (el as any).webkitRequestFullscreen;
    if (requestFullscreenFn) {
        try {
            requestFullscreenFn.call(el)?.catch(onError);
            return;
        } catch (error) {
            onError(error);
        }
    }
    onError(new Error("Fullscreen not supported"));
};
