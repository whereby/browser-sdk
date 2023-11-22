import * as groupsGrid from "../VideoStageLayout/GroupsPreview/groupsGridLayout";
import * as groupsTable from "../VideoStageLayout/GroupsPreview/groupsTableLayout";

import { default as LAYOUT_CONSTANTS } from "../constants/layout";
const { DESKTOP_BREAKPOINT, TABLET_BREAKPOINT, PHONE_BREAKPOINT } = LAYOUT_CONSTANTS;

// Types

export interface Client {
    avatarUrl: string;
    displayName: string;
    id: string;
    clientId: string;
    localVolume?: number;
    isAudioEnabled: boolean;
    isLocalClient: boolean;
    isVideoEnabled: boolean;
    isPresentation?: boolean;
    roleName: string;
    stream: MediaStream;
    breakoutGroupAssigned?: string;
    breakoutGroup?: string;
}
export interface Origin {
    top: number;
    left: number;
}
export function makeOrigin({ top = 0, left = 0 } = {}): Origin {
    return {
        top,
        left,
    };
}

export interface Bounds {
    width: number;
    height: number;
}
export function makeBounds({ width = 0, height = 0 } = {}): Bounds {
    return {
        width: Math.max(width, 0),
        height: Math.max(height, 0),
    };
}

export interface Frame {
    bounds: Bounds;
    origin: Origin;
}
export function makeFrame({ top = 0, left = 0, width = 0, height = 0 } = {}): Frame {
    return {
        bounds: makeBounds({ width, height }),
        origin: makeOrigin({ top, left }),
    };
}

export interface Box {
    top: number;
    left: number;
    bottom: number;
    right: number;
}
export function makeBox({ top = 0, left = 0, bottom = 0, right = 0 } = {}): Box {
    return {
        top,
        left,
        bottom,
        right,
    };
}

export function hasBounds(bounds?: Bounds) {
    if (!bounds) {
        return false;
    }
    return !(bounds.width <= 0 || bounds.height <= 0);
}

export function insetBounds({ bounds, fromBounds }: { bounds: Bounds; fromBounds: Bounds }) {
    return {
        width: Math.max(fromBounds.width - bounds.width, 0),
        height: Math.max(fromBounds.height - bounds.height, 0),
    };
}

export interface Video {
    clientId: string;
    isDraggable?: boolean;
    aspectRatio: number;
}
export interface VideoCell extends Video {
    type: "video" | "integration" | "copy_link" | "signup_cta" | "groups";
    bounds: Bounds;
    origin: Origin;
    isSmallCell?: boolean;
    paddings?: Box;
}
export interface Rect {
    origin: {
        x: number;
        y: number;
    };
    bounds: Bounds;
}
export interface VideosContainerLayout {
    isPortrait: boolean;
    presentationGrid: Frame;
    videoGrid: Frame;
}
export interface GridLayout {
    cellRects?: Rect[];
    cellCount?: number;
    gridGap: number;
    extraHorizontalPadding: number;
    extraVerticalPadding: number;
    paddings: Box;
}
export interface CenterGridLayout {
    cellCount: number;
    cellHeight: number;
    cellWidth: number;
    cols: number;
    rows: number;
    extraHorizontalPadding: number;
    extraVerticalPadding: number;
    // pass through
    gridGap: number;
    paddings: Box;
}
export type StageLayoutGroups =
    | ReturnType<typeof groupsGrid.calculateLayout>
    | ReturnType<typeof groupsTable.calculateLayout>;
export interface CalculatedStageLayout {
    isPortrait: boolean;
    videosContainer: Frame;
    subgrid: Frame & {
        contentBounds: Bounds;
        cells: VideoCell[];
    };
    hasOverflow: boolean;
    overflowNeedBounds?: Bounds;
}
export interface StageLayout extends CalculatedStageLayout {
    bounds: Bounds;
    gridGap: number;
    presentationGrid: Frame & {
        paddings: Box;
        cells: VideoCell[];
    };
    videoGrid: Frame & {
        paddings: Box;
        cells: VideoCell[];
    };
    floatingContent?: VideoCell;
    groups?: StageLayoutGroups;
}
export interface Layout {
    isPortrait: boolean;
    width: number;
    height: number;
    cellBounds: Bounds;
    cellCount: number;
    rows: number;
    cols: number;
    extraHorizontalPadding: number;
    extraVerticalPadding: number;
    paddings: Box;
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
