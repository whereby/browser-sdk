import { fitToBounds } from "./gridUtils";

import * as centerGrid from "./centerGridLayout";

import { makeOrigin, makeBounds, makeFrame, makeBox, Frame, Bounds, Origin } from "./layout";
import { type Box } from "./layout";
import layoutConstants from "./layoutConstants";

const { BOTTOM_TOOLBAR_HEIGHT, VIDEO_CONTROLS_MIN_WIDTH, TABLET_BREAKPOINT } = layoutConstants;

const MIN_GRID_HEIGHT = 200;
const MIN_GRID_WIDTH = 300;
const FLOATING_VIDEO_SIZE = 200;
const CONSTRAINED_OVERFLOW_TRIGGER = 12;

function getMinGridBounds({ cellCount }: { cellCount: number }): Bounds {
    // Reduce min grid dimensions if we have 6 videos or less
    const isSmallGrid = cellCount <= 6;
    const minGridHeight = isSmallGrid ? MIN_GRID_HEIGHT - 50 : MIN_GRID_HEIGHT;
    const minGridWidth = isSmallGrid ? MIN_GRID_WIDTH - 50 : MIN_GRID_WIDTH;
    return makeBounds({ width: minGridWidth, height: minGridHeight });
}

export function fitSupersizedContent({
    bounds,
    aspectRatio,
    minGridContainerBounds,
    hasPresentationGrid,
}: {
    bounds: Bounds;
    aspectRatio: number;
    minGridContainerBounds: Bounds;
    hasPresentationGrid: boolean;
}) {
    const { width, height } = bounds;

    // If we don't have any grids take up whole stage
    const hasVideoGrid = minGridContainerBounds.width > 0;
    if (!hasVideoGrid) {
        return {
            isPortrait: width <= height,
            supersizedContentBounds: bounds,
        };
    }

    // Calculate minimum supersized content bounds - take up at least half the
    // available area:
    const minHorizontalSupersizedContentWidth = Math.round(width / 2);
    const minVerticalSupersizedContentHeight = Math.round(height / 2);
    // Calculate maximum supersized content bounds
    const maxHorizontalSupersizedContentWidth = Math.max(width - minGridContainerBounds.width, 0);
    const maxVerticalSupersizedContentHeight = Math.max(height - minGridContainerBounds.height, 0);
    let isPortrait = maxHorizontalSupersizedContentWidth <= maxVerticalSupersizedContentHeight;

    let horizontalCorrection = 0;
    let verticalCorrection = 0;

    // Do we have an aspect ratio? If not give up all available space (ex some integrations)
    if (aspectRatio) {
        // Calculate fit bounds for both portrait and landscape layouts:

        // 1. grid to the left of content
        const horizontalContentBounds = fitToBounds(aspectRatio, {
            width: maxHorizontalSupersizedContentWidth,
            height,
        });

        // 2. grid below content
        const verticalContentBounds = fitToBounds(aspectRatio, {
            width,
            height: maxVerticalSupersizedContentHeight,
        });

        // Pick direction that gives content most space:
        const isPortraitContent = aspectRatio <= 1.0;
        isPortrait = isPortraitContent
            ? verticalContentBounds.height > horizontalContentBounds.height
            : verticalContentBounds.width > horizontalContentBounds.width;

        // Give wasted space back to the video grid:
        if (isPortrait) {
            const wastedSpace =
                maxVerticalSupersizedContentHeight -
                Math.max(verticalContentBounds.height, minVerticalSupersizedContentHeight);
            verticalCorrection = Math.max(wastedSpace, 0);
        } else {
            const wastedSpace =
                maxHorizontalSupersizedContentWidth -
                Math.max(horizontalContentBounds.width, minHorizontalSupersizedContentWidth);
            horizontalCorrection = Math.max(wastedSpace, 0);
        }
    } else if (hasPresentationGrid) {
        // If we have more than one presentation grid cell we naively favor portrait orientation
        // unless it gets too squished:
        isPortrait = maxHorizontalSupersizedContentWidth / maxVerticalSupersizedContentHeight >= 5;
    }

    const supersizedContentBounds = {
        width: isPortrait ? width : maxHorizontalSupersizedContentWidth - horizontalCorrection,
        height: isPortrait ? maxVerticalSupersizedContentHeight - verticalCorrection : height,
    };

    return {
        isPortrait,
        supersizedContentBounds,
    };
}

// The stage layout is the base room layout
// It divides the stage area between a videos container (made up of video grid +
// presentation grid)

export function calculateStageLayout({
    containerBounds,
    containerOrigin,
    hasConstrainedOverflow,
    hasPresentationContent,
    hasVideoContent,
    isPortrait,
}: {
    containerBounds: Bounds;
    containerOrigin: Origin;
    gridGap: number;
    hasConstrainedOverflow: boolean;
    hasPresentationContent: boolean;
    hasVideoContent: boolean;
    isPortrait: boolean;
}) {
    const hasVideos = hasPresentationContent || hasVideoContent;

    // Sanity checks

    // Do we have anything to calculate?
    if (!hasVideos) {
        return {
            isPortrait,
            videosContainer: makeFrame(),
            hasOverflow: false,
        };
    }

    return {
        isPortrait,
        videosContainer: makeFrame({ ...containerBounds, ...containerOrigin }),
        hasOverflow: hasConstrainedOverflow,
    };
}

export function calculateVideosContainerLayout({
    containerBounds,
    containerOrigin,
    gridGap,
    supersizedContentAspectRatio,
    hasPresentationContent,
    hasPresentationGrid,
    hasVideoContent,
    minGridBounds,
}: {
    containerBounds: Bounds;
    containerOrigin: Origin;
    gridGap: number;
    supersizedContentAspectRatio: number;
    hasPresentationContent: boolean;
    hasPresentationGrid: boolean;
    hasVideoContent: boolean;
    minGridBounds: Bounds;
}) {
    const { width, height } = containerBounds;
    let isPortrait = width <= height;

    let presentationGridBounds = makeBounds();
    let presentationGridOrigin = makeOrigin();
    let videoGridBounds = hasVideoContent ? { ...containerBounds } : makeBounds();
    let videoGridOrigin = hasVideoContent ? { ...containerOrigin } : makeOrigin();

    if (hasPresentationContent) {
        // Fit supersized content
        const minGridContainerBounds = makeBounds({
            width: hasVideoContent ? minGridBounds.width + gridGap : 0,
            height: hasVideoContent ? minGridBounds.height + gridGap : 0,
        });
        const supersizedContentLayout = fitSupersizedContent({
            bounds: containerBounds,
            aspectRatio: supersizedContentAspectRatio,
            minGridContainerBounds,
            hasPresentationGrid,
        });
        isPortrait = supersizedContentLayout.isPortrait;

        presentationGridBounds = supersizedContentLayout.supersizedContentBounds;
        presentationGridOrigin = { ...containerOrigin };

        if (hasVideoContent) {
            videoGridBounds = makeBounds({
                width: isPortrait
                    ? containerBounds.width
                    : containerBounds.width - presentationGridBounds.width - gridGap,
                height: isPortrait
                    ? containerBounds.height - presentationGridBounds.height - gridGap
                    : containerBounds.height,
            });

            videoGridOrigin = makeOrigin({
                top: isPortrait ? containerOrigin.top + presentationGridBounds.height + gridGap : containerOrigin.top,
                left: isPortrait ? containerOrigin.left : containerOrigin.left + presentationGridBounds.width + gridGap,
            });
        }
    }

    return {
        isPortrait,
        presentationGrid: {
            ...makeFrame({
                ...presentationGridBounds,
                ...presentationGridOrigin,
            }),
        },
        videoGrid: makeFrame({
            ...videoGridBounds,
            ...videoGridOrigin,
        }),
    };
}

function calculateGridLayout({
    containerBounds,
    paddings = makeBox(),
    videos,
    isConstrained,
    maxGridWidth,
    gridGap,
}: {
    containerBounds: Bounds;
    paddings?: Box;
    videos: { clientId: string; isDraggable: boolean; aspectRatio: number }[];
    isConstrained: boolean;
    maxGridWidth: number;
    gridGap: number;
}) {
    const { width, height } = containerBounds;
    const cappedWidth = maxGridWidth ? Math.min(width, maxGridWidth) : width;
    const cellCount = videos.length;

    let videoCells = null;

    const cellAspectRatios = videos.map((video) => video.aspectRatio);
    const minGridBounds = getMinGridBounds({ cellCount });
    // Cap grid to a sane width (on very wide monitors)
    const gridLayout = centerGrid.calculateLayout({
        width: cappedWidth,
        height,
        cellCount,
        gridGap,
        cellAspectRatios,
        paddings,
    });

    videoCells = videos.map((video, index) => {
        const cellProps = centerGrid.getCellPropsAtIndexForLayout({ index, layout: gridLayout });
        const isSmallCell = gridLayout.cellWidth < minGridBounds.width;
        const shouldZoom = isConstrained || isSmallCell;
        const aspectRatio = shouldZoom ? gridLayout.cellWidth / gridLayout.cellHeight : video.aspectRatio;

        return {
            clientId: video.clientId,
            isDraggable: video.isDraggable,
            origin: makeOrigin({
                top: cellProps.top,
                left: cellProps.left,
            }),
            bounds: makeBounds({
                width: cellProps.width,
                height: cellProps.height,
            }),
            aspectRatio,
            isSmallCell,
        };
    });

    return {
        videoCells,
        extraHorizontalPadding:
            // If we hit the max width, pass up as extra space
            width !== cappedWidth
                ? gridLayout.extraHorizontalPadding + (width - cappedWidth) / 2
                : gridLayout.extraHorizontalPadding,
        extraVerticalPadding: gridLayout.extraVerticalPadding,
        paddings: gridLayout.paddings,
        gridGap,
    };
}

function calculateFloatingLayout({
    roomBounds,
    containerFrame,
    floatingVideo,
    videoControlsHeight,
    margin = 8,
}: {
    roomBounds: Bounds;
    containerFrame: Frame;
    floatingVideo: { clientId: string; isDraggable: boolean; aspectRatio: number } | null;
    videoControlsHeight: number;
    margin?: number;
}) {
    if (!floatingVideo) {
        return null;
    }
    const bounds = fitToBounds(floatingVideo.aspectRatio, {
        width: FLOATING_VIDEO_SIZE,
        height: FLOATING_VIDEO_SIZE,
    });
    // Determine if we should position above the video controls or not
    const isFloating = !(roomBounds.height - containerFrame.bounds.height - containerFrame.origin.top);
    const isConstrained = containerFrame.bounds.width - (bounds.width + margin) * 2 < VIDEO_CONTROLS_MIN_WIDTH;
    let verticalOffset = 0;
    if (isFloating && isConstrained) {
        // Pull up above floating video controls
        verticalOffset = videoControlsHeight * -1;
    } else if (!isFloating && !isConstrained) {
        // Push down over the bottom toolbar
        verticalOffset = videoControlsHeight;
    }
    const origin = makeOrigin({
        top: containerFrame.origin.top + (containerFrame.bounds.height - bounds.height - margin) + verticalOffset,
        left: containerFrame.origin.left + (containerFrame.bounds.width - bounds.width - margin),
    });
    const videoCell = {
        clientId: floatingVideo.clientId,
        isDraggable: floatingVideo.isDraggable,
        origin,
        bounds,
        aspectRatio: floatingVideo.aspectRatio,
        isSmallCell: true,
    };
    return videoCell;
}

function rebalanceLayoutPaddedAreas({
    a,
    b,
    gridGap,
    isPortrait,
}: {
    a: { horizontal: number; vertical: number };
    b: { horizontal: number; vertical: number };
    gridGap: number;
    isPortrait: boolean;
}) {
    const aPad = isPortrait ? a.vertical : a.horizontal;
    const bPad = isPortrait ? b.vertical : b.horizontal;
    if (aPad === bPad) {
        return { a: 0, b: 0 };
    }
    const sArea = aPad < bPad ? a : b;
    const sAreaPad = isPortrait ? sArea.vertical : sArea.horizontal;
    const spaceBetween = gridGap + (aPad + bPad);
    const offset = (spaceBetween + sAreaPad) / 2 - sAreaPad;
    return {
        a: sArea === a ? offset : 0,
        b: sArea === b ? offset : 0,
    };
}

type VideoContainerLayout = {
    isPortrait: boolean;
    presentationGrid: Frame;
    videoGrid: Frame;
};
type GridLayout = {
    videoCells: { clientId: string; isDraggable: boolean; aspectRatio: number }[];
    extraHorizontalPadding: number;
    extraVerticalPadding: number;
    paddings: Box;
    gridGap: number;
};

function rebalanceLayoutInPlace({
    videosContainerLayout,
    gridLayout,
    presentationGridLayout,
    gridGap,
}: {
    videosContainerLayout: VideoContainerLayout;
    gridLayout: GridLayout;
    presentationGridLayout: GridLayout;
    gridGap: number;
}) {
    const hasPresentationGrid = videosContainerLayout.presentationGrid.bounds.width > 0;
    const hasVideoGrid = videosContainerLayout.videoGrid.bounds.width > 0;

    const videoGridRebalanceOffset = { vertical: 0, horizontal: 0 };

    // Rebalance video containers if we have both presentationGrid and videoGrid bounds,
    // unless we have a breakout no group stage:
    if (hasPresentationGrid && hasVideoGrid) {
        const correction = rebalanceLayoutPaddedAreas({
            a: {
                horizontal: presentationGridLayout.extraHorizontalPadding,
                vertical: presentationGridLayout.extraVerticalPadding,
            },
            b: {
                horizontal: gridLayout.extraHorizontalPadding,
                vertical: gridLayout.extraVerticalPadding,
            },
            gridGap,
            isPortrait: videosContainerLayout.isPortrait,
        });

        // Update in place:
        if (videosContainerLayout.isPortrait) {
            videosContainerLayout.presentationGrid.origin.top += correction.a;
            videosContainerLayout.videoGrid.origin.top -= correction.b;
            // Save off how much we moved the grid over to be used in the next phase:
            videoGridRebalanceOffset.vertical = correction.b;
        } else {
            videosContainerLayout.presentationGrid.origin.left += correction.a;
            videosContainerLayout.videoGrid.origin.left -= correction.b;
            // Save off how much we moved the grid over to be used in the next phase:
            videoGridRebalanceOffset.horizontal = correction.b;
        }
    }
}

interface CalculateGridLayoutsOptions {
    gridGap: number;
    isConstrained: boolean;
    presentationVideos: { clientId: string; isDraggable: boolean; aspectRatio: number }[];
    videos: { clientId: string; isDraggable: boolean; aspectRatio: number }[];
    videosContainerLayout: VideoContainerLayout;
    gridLayoutPaddings?: Box;
    presentationGridLayoutPaddings?: Box;
    maxGridWidth: number;
}

function calculateGridLayouts({
    gridGap,
    isConstrained,
    presentationVideos,
    videos,
    videosContainerLayout,
    gridLayoutPaddings = makeBox(),
    presentationGridLayoutPaddings = makeBox(),
    maxGridWidth,
}: CalculateGridLayoutsOptions) {
    // Lay out video cells in provided video containers:
    const gridLayout = calculateGridLayout({
        containerBounds: videosContainerLayout.videoGrid.bounds,
        gridGap,
        isConstrained,
        maxGridWidth,
        paddings: gridLayoutPaddings,
        videos,
    });
    const presentationGridLayout = calculateGridLayout({
        containerBounds: videosContainerLayout.presentationGrid.bounds,
        gridGap,
        isConstrained,
        maxGridWidth,
        paddings: presentationGridLayoutPaddings,
        videos: presentationVideos,
    });

    return { gridLayout, presentationGridLayout };
}

// autofill arguments from calculateLayout function
interface CalculateLayoutOptions {
    breakoutActive?: boolean;
    breakoutGroupedClients?: [];
    breakoutStagePaddings?: Box;
    floatingVideo?: { clientId: string; isDraggable: boolean; aspectRatio: number } | null;
    frame: Frame;
    gridGap: number;
    isConstrained: boolean;
    isMaximizeMode?: boolean;
    isXLMeetingSize?: boolean;
    paddings?: Box;
    presentationVideos?: { clientId: string; isDraggable: boolean; aspectRatio: number }[];
    rebalanceLayout?: boolean;
    roomBounds: Bounds;
    roomLayoutHasOverlow?: boolean;
    videoControlsHeight?: number;
    videos?: { clientId: string; isDraggable: boolean; aspectRatio: number }[];
    videoGridGap?: number;
}

export function calculateLayout({
    floatingVideo = null,
    frame,
    gridGap = 0,
    isConstrained = false,
    isMaximizeMode = false,
    paddings = makeBox(),
    presentationVideos = [],
    rebalanceLayout = false,
    roomBounds,
    roomLayoutHasOverlow = false,
    videoControlsHeight = 0,
    videos = [],
    videoGridGap = 0,
}: CalculateLayoutOptions) {
    const hasPresentationContent = !!presentationVideos.length;
    const hasPresentationGrid = presentationVideos.length > 1;
    const supersizedContentAspectRatio =
        hasPresentationContent && !hasPresentationGrid ? presentationVideos[0].aspectRatio : 1;
    const hasVideoContent = !!videos.length;
    const width = frame.bounds.width - paddings.left - paddings.right;
    let height = frame.bounds.height - paddings.top - paddings.bottom;
    const maxGridWidth = Math.max(25 * 88, (80 / 100) * width); // go up to 80vw after a sane max width

    // On mobile, we set a hard limit on 12 videos, and overflows after that.
    const hasConstrainedOverflow = (isConstrained && videos.length > CONSTRAINED_OVERFLOW_TRIGGER) || false;
    const lineHeight = height / 4;
    const extraLines = Math.ceil((videos.length - CONSTRAINED_OVERFLOW_TRIGGER) / 3);

    height = hasConstrainedOverflow ? height + lineHeight * extraLines : height;

    const stageBounds = makeBounds({ width, height });
    const stageOrigin = makeOrigin({ top: paddings.top, left: paddings.left });
    const _minBounds = getMinGridBounds({ cellCount: videos.length });
    const minGridBounds = _minBounds;

    const isSmallScreen = roomBounds.width < TABLET_BREAKPOINT || roomBounds.height < TABLET_BREAKPOINT;

    const forceStageLayoutPortrait = isMaximizeMode;
    const stageLayoutIsPortrait =
        forceStageLayoutPortrait ||
        !(hasPresentationContent || hasVideoContent) ||
        stageBounds.width <= stageBounds.height;

    const stableStageLayoutProps = {
        cellPaddings: { top: 4, left: 4, bottom: 4, right: 4 },
        containerBounds: stageBounds,
        containerOrigin: stageOrigin,
        gridGap,
        hasPresentationContent,
        hasVideoContent,
        isConstrained,
        isMaximizeMode,
        isSmallScreen,
        maxGridWidth,
    };

    let stageLayout = calculateStageLayout({
        ...stableStageLayoutProps,
        isPortrait: stageLayoutIsPortrait,
        hasConstrainedOverflow,
    });

    // Prevent yo-yo-ing between overflow and non overflow states:
    // - if we're not in a forced overflow state and main room layout has overflow already (prev we could not fit) and now we can fit,
    // - double check by re-running the stage layout with the non overflow bounds:
    let forceRerunAsOverflow = false;
    if (roomLayoutHasOverlow && !stageLayout.hasOverflow) {
        const _stageLayout = calculateStageLayout({
            ...stableStageLayoutProps,
            containerBounds: makeBounds({
                width: stageBounds.width,
                height: stageBounds.height - BOTTOM_TOOLBAR_HEIGHT, // override "stable" prop
            }),
            isPortrait: stageLayoutIsPortrait,
            hasConstrainedOverflow,
        });
        // If it turns out we can't fit, force re-layout as overflow:
        if (_stageLayout.hasOverflow) {
            forceRerunAsOverflow = true;
        }
    }

    // If subgrid cannot fit, re-run the stage layout in overflow:
    if (forceRerunAsOverflow || stageLayout.hasOverflow) {
        stageLayout = calculateStageLayout({
            ...stableStageLayoutProps,
            isPortrait: true,
            hasConstrainedOverflow,
        });
    }

    const videosContainerLayout = calculateVideosContainerLayout({
        containerBounds: stageLayout.videosContainer.bounds,
        containerOrigin: stageLayout.videosContainer.origin,
        gridGap,
        supersizedContentAspectRatio,
        hasPresentationContent,
        hasPresentationGrid,
        hasVideoContent,
        minGridBounds,
    });

    const { gridLayout, presentationGridLayout } = calculateGridLayouts({
        gridGap: videoGridGap,
        isConstrained,
        presentationVideos,
        videos,
        videosContainerLayout,
        maxGridWidth,
    });

    const floatingLayout = calculateFloatingLayout({
        roomBounds,
        containerFrame: frame,
        floatingVideo,
        videoControlsHeight,
    });

    // Nudge containers closer to each other to get pleasing layouts with less extreme
    // negative space. It's opt in because debugging is a lot easier with this behavior off:
    if (rebalanceLayout) {
        rebalanceLayoutInPlace({
            videosContainerLayout,
            gridLayout,
            presentationGridLayout,
            gridGap,
        });
    }

    return {
        isPortrait: stageLayout.isPortrait,
        hasOverflow: stageLayout.hasOverflow,
        bounds: makeBounds({
            height: frame.bounds.height,
            width: frame.bounds.width,
        }),
        gridGap,
        presentationGrid: {
            ...videosContainerLayout.presentationGrid,
            cells: presentationGridLayout.videoCells,
            paddings: makeBox({
                top: presentationGridLayout.paddings.top + presentationGridLayout.extraVerticalPadding,
                bottom: presentationGridLayout.paddings.bottom + presentationGridLayout.extraVerticalPadding,
                left: presentationGridLayout.paddings.left + presentationGridLayout.extraHorizontalPadding,
                right: presentationGridLayout.paddings.right + presentationGridLayout.extraHorizontalPadding,
            }),
        },
        videoGrid: {
            ...videosContainerLayout.videoGrid,
            cells: gridLayout.videoCells,
            paddings: makeBox({
                top: gridLayout.paddings.top + gridLayout.extraVerticalPadding,
                bottom: gridLayout.paddings.bottom + gridLayout.extraVerticalPadding,
                left: gridLayout.paddings.left + gridLayout.extraHorizontalPadding,
                right: gridLayout.paddings.right + gridLayout.extraHorizontalPadding,
            }),
        },
        floatingContent: {
            ...floatingLayout,
            ...floatingVideo,
        },
    };
}
