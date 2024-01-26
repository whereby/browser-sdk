import layoutConstants from "./layoutConstants";

const { DESKTOP_BREAKPOINT, TABLET_BREAKPOINT, PHONE_BREAKPOINT } = layoutConstants;

// Types
export type Box = {
    top: number;
    left: number;
    bottom: number;
    right: number;
};

export type Origin = {
    top: number;
    left: number;
};

export type Bounds = {
    width: number;
    height: number;
};

export type Frame = {
    origin: Origin;
    bounds: Bounds;
};

export function makeOrigin({ top = 0, left = 0 } = {}): Origin {
    return {
        top,
        left,
    };
}

export function makeBounds({ width = 0, height = 0 } = {}): Bounds {
    return {
        width: Math.max(width, 0),
        height: Math.max(height, 0),
    };
}

export function makeFrame({ top = 0, left = 0, width = 0, height = 0 } = {}): Frame {
    return {
        bounds: makeBounds({ width, height }),
        origin: makeOrigin({ top, left }),
    };
}

export function makeBox({ top = 0, left = 0, bottom = 0, right = 0 } = {}): Box {
    return {
        top,
        left,
        bottom,
        right,
    };
}

export function hasBounds(bounds: { width: number; height: number }): boolean {
    if (!bounds) {
        return false;
    }
    return !(bounds.width <= 0 || bounds.height <= 0);
}

export function insetBounds({ bounds, fromBounds }: { bounds: Bounds; fromBounds: Bounds }): Bounds {
    return {
        width: Math.max(fromBounds.width - bounds.width, 0),
        height: Math.max(fromBounds.height - bounds.height, 0),
    };
}
// Responsive

export function isBoundsPhone(bounds: Bounds, isLandscape: boolean) {
    const isVerticalPhone = !isLandscape && bounds.width <= PHONE_BREAKPOINT;
    const isHorizontalPhone = isLandscape && bounds.height <= PHONE_BREAKPOINT && bounds.width <= TABLET_BREAKPOINT;
    return isVerticalPhone || isHorizontalPhone;
}

export function isBoundsTablet(bounds: Bounds, isLandscape: boolean) {
    const isVerticalTablet = !isLandscape && bounds.width <= TABLET_BREAKPOINT;
    const isHorizontalTablet = isLandscape && bounds.height <= TABLET_BREAKPOINT && bounds.width <= DESKTOP_BREAKPOINT;
    return isVerticalTablet || isHorizontalTablet;
}

export function calculateResponsiveLayout(bounds: Bounds) {
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
