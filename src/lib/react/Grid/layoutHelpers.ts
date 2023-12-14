import { DESKTOP_BREAKPOINT, TABLET_BREAKPOINT, PHONE_BREAKPOINT } from "./layoutConstants";

// Types

export function makeOrigin({ top = 0, left = 0 } = {}) {
    return {
        top,
        left,
    };
}

export function makeBounds({ width = 0, height = 0 } = {}) {
    return {
        width: Math.max(width, 0),
        height: Math.max(height, 0),
    };
}

export function makeFrame({ top = 0, left = 0, width = 0, height = 0 } = {}) {
    return {
        bounds: makeBounds({ width, height }),
        origin: makeOrigin({ top, left }),
    };
}

export function makeBox({ top = 0, left = 0, bottom = 0, right = 0 } = {}) {
    return {
        top,
        left,
        bottom,
        right,
    };
}

export function hasBounds(bounds: { width: number; height: number }}) {
    if (!bounds) {
        return false;
    }
    return !(bounds.width <= 0 || bounds.height <= 0);
}

export function insetBounds({ bounds, fromBounds }: { bounds: { width: number; height: number }; fromBounds: { width: number; height: number }}) {
    return {
        width: Math.max(fromBounds.width - bounds.width, 0),
        height: Math.max(fromBounds.height - bounds.height, 0),
    };
}
// Responsive

export function isBoundsPhone(bounds: {width: number; height: number}, isLandscape: boolean) {
    const isVerticalPhone = !isLandscape && bounds.width <= PHONE_BREAKPOINT;
    const isHorizontalPhone = isLandscape && bounds.height <= PHONE_BREAKPOINT && bounds.width <= TABLET_BREAKPOINT;
    return isVerticalPhone || isHorizontalPhone;
}

export function isBoundsTablet(bounds: {width: number; height: number}, isLandscape: boolean) {
    const isVerticalTablet = !isLandscape && bounds.width <= TABLET_BREAKPOINT;
    const isHorizontalTablet = isLandscape && bounds.height <= TABLET_BREAKPOINT && bounds.width <= DESKTOP_BREAKPOINT;
    return isVerticalTablet || isHorizontalTablet;
}

export function calculateResponsiveLayout(bounds: {width: number; height: number}) {
    const isLandscape = bounds.width > bounds.height;
    const isPhone = isBoundsPhone(bounds, isLandscape);
    const isTablet = !isPhone && isBoundsTablet(bounds, isLandscape);
    const isDesktop = !isPhone && !isTablet;
    return {
        isPhone,
        isTablet,
        isDesktop,
        isLandscape,
        isPortrait: !isLandscape,
    };
}
