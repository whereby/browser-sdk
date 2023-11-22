import { fitToBounds } from "./VideoGrid/gridUtils";

import * as centerGrid from "./VideoGrid/centerGridLayout";
import * as constrainedGrid from "./VideoGrid/constrainedGridLayout";
import * as subgrid from "./VideoGrid/subgridLayout";
import * as groupsGrid from "./GroupsPreview/groupsGridLayout";
import * as groupsTable from "./GroupsPreview/groupsTableLayout";

import {
    makeOrigin,
    makeBounds,
    makeFrame,
    insetBounds,
    makeBox,
    Bounds,
    Layout,
    Origin,
    GridLayout,
    CenterGridLayout,
    Frame,
    Video,
    VideoCell,
    StageLayout,
    VideosContainerLayout,
    StageLayoutGroups,
    CalculatedStageLayout,
} from "../helpers/layout";
import { default as LAYOUT_CONSTANTS } from "../constants/layout";
import { Box } from "../helpers/layout";
const { BOTTOM_TOOLBAR_HEIGHT, VIDEO_CONTROLS_MIN_WIDTH, SUBGRID_EMPTY_STAGE_MAX_WIDTH, TABLET_BREAKPOINT } =
    LAYOUT_CONSTANTS;

const MIN_GRID_HEIGHT = 200;
const MIN_GRID_WIDTH = 300;
const FLOATING_VIDEO_SIZE = 200;
const OVERFLOW_ROOM_SUBGRID_TOP_PADDING = 20;
const CONSTRAINED_OVERFLOW_TRIGGER = 12;

export const SUBGRID_CELL_PADDING_BOX = makeBox({ top: 4, bottom: 4 + 20 + 4, left: 8, right: 8 });

type CellSizeOptions = [number] | [number, number];
function getSubgridSizeOptions({
    hasOverflow,
    hasStage,
}: {
    hasOverflow: boolean;
    hasStage: boolean;
}): CellSizeOptions {
    // If we have an overflow we don't have to make the grid responsive
    if (hasOverflow && hasStage) {
        return [80];
    }
    return [80, 60]; // note: must be in descending order
}

function getMinGridBounds({ cellCount }: { cellCount: number }) {
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
    aspectRatio?: number;
    bounds: Bounds;
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

function findBestSubgridLayout({
    containerBounds,
    isPortrait,
    cellCount,
    cellSizeOptions,
    cellPaddings,
    paddings,
}: {
    containerBounds: Bounds;
    isPortrait: boolean;
    cellCount: number;
    cellSizeOptions: CellSizeOptions;
    cellPaddings: Box;
    paddings: Box;
}): Layout {
    let layout;
    for (let i = 0; i < cellSizeOptions.length; i++) {
        const cellSize = cellSizeOptions[i];
        layout = subgrid.calculateLayout({
            containerBounds,
            isPortrait,
            cellCount,
            cellBounds: makeBounds({
                width: cellSize + cellPaddings.left + cellPaddings.right,
                height: cellSize + cellPaddings.top + cellPaddings.bottom,
            }),
            paddings,
        });
        // Assuming options are sorted from largest to smallest, return first option we can fit everything in:
        if (layout.width <= containerBounds.width && layout.height <= containerBounds.height) {
            return layout;
        }
    }
    // Return the smallest even if we overflow as we're out of options:
    return (
        layout ||
        subgrid.calculateLayout({
            containerBounds,
            isPortrait,
            cellCount,
            cellBounds: makeBounds({
                width: cellSizeOptions[cellSizeOptions.length - 1] + cellPaddings.left + cellPaddings.right,
                height: cellSizeOptions[cellSizeOptions.length - 1] + cellPaddings.top + cellPaddings.bottom,
            }),
            paddings,
        })
    );
}

function calculateSubgridLayout({
    containerBounds,
    isPortrait,
    cellCount,
    cellSizeOptions,
    cellPaddings,
    paddings,
}: {
    containerBounds: Bounds;
    isPortrait: boolean;
    cellCount: number;
    cellSizeOptions: CellSizeOptions;
    cellPaddings: Box;
    paddings: Box;
}): { bounds: Bounds; contentBounds: Bounds; videoCells: VideoCell[] } {
    const layout = findBestSubgridLayout({
        containerBounds,
        isPortrait,
        cellCount,
        cellSizeOptions,
        cellPaddings,
        paddings,
    });
    // If we're the smallest size, the subgrid cell is small:
    const isSmallCell =
        layout.cellBounds.width - cellPaddings.left - cellPaddings.right ===
        cellSizeOptions[cellSizeOptions.length - 1];
    const bounds = makeBounds({
        width: Math.min(layout.width, containerBounds.width),
        height: Math.min(layout.height, containerBounds.height),
    });
    const contentBounds = makeBounds({ width: layout.width, height: layout.height });

    if (cellCount === 0) {
        return {
            bounds,
            contentBounds,
            videoCells: [],
        };
    }

    return {
        bounds,
        contentBounds,
        videoCells: [...Array(cellCount)].map((_, index) => {
            const { top, left, width, height } = subgrid.getCellPropsAtIndexForLayout({ index, layout });
            return {
                origin: makeOrigin({ top, left }),
                bounds: makeBounds({ width, height }),
                paddings: cellPaddings,
                isSmallCell,
                aspectRatio: width / height,
                clientId: "",
            };
        }),
    };
}

// The stage layout is the base room layout
// It divides the stage area between a videos container (made up of video grid +
// presentation grid) and the subgrid (if applicable).
export function calculateStageLayout({
    cellPaddings,
    cellSizeOptions,
    containerBounds,
    containerOrigin,
    gridGap,
    hasConstrainedOverflow,
    hasPresentationContent,
    hasVideoContent,
    isConstrained,
    isMaximizeMode,
    isPortrait,
    isSmallScreen,
    maxGridWidth,
    shouldOverflowSubgrid,
    subgridVideos,
}: {
    cellPaddings: Box;
    cellSizeOptions: CellSizeOptions;
    containerBounds: Bounds;
    containerOrigin: Origin;
    gridGap: number;
    hasConstrainedOverflow: boolean;
    hasPresentationContent: boolean;
    hasVideoContent: boolean;
    isConstrained: boolean;
    isMaximizeMode: boolean;
    isPortrait: boolean;
    isSmallScreen: boolean;
    maxGridWidth: number;
    shouldOverflowSubgrid: boolean;
    subgridVideos: Video[];
}): CalculatedStageLayout {
    const { width, height } = containerBounds;
    const hasVideos = hasPresentationContent || hasVideoContent;
    const hasSubgrid = subgridVideos.length > 0;

    // Sanity checks

    // Do we have anything to calculate?
    if (!hasSubgrid && !hasVideos) {
        return {
            isPortrait,
            videosContainer: makeFrame(),
            subgrid: {
                ...makeFrame(),
                contentBounds: makeBounds(),
                cells: [],
            },
            hasOverflow: false,
        };
    }

    // Give up whole space to videos if we have no subgrid
    if (!hasSubgrid) {
        return {
            isPortrait,
            videosContainer: makeFrame({ ...containerBounds, ...containerOrigin }),
            subgrid: {
                ...makeFrame(),
                contentBounds: makeBounds(),
                cells: [],
            },
            hasOverflow: hasConstrainedOverflow,
        };
    }

    // Things get a bit more complicated from here:
    // - we're either told to overflow the room if shouldOverflowSubgrid is true
    // - or we try to fit into a sane container and fail, thus resulting in an overflow state

    const topSubgridPadding = shouldOverflowSubgrid ? OVERFLOW_ROOM_SUBGRID_TOP_PADDING : 0;

    // Figure out what bounds we want the grid to fit into:
    let _containerBounds = null;
    if (!hasVideos) {
        // We have an empty stage - just the subgrid:
        // - limit the width of the empty stage subgrid to something sane so it's not overwhelming
        _containerBounds = makeBounds({
            width: Math.min(SUBGRID_EMPTY_STAGE_MAX_WIDTH, containerBounds.width),
            height: containerBounds.height,
        });
    } else if (shouldOverflowSubgrid) {
        // We have an overflow stage:
        // - give up only bottom section of the container bounds and let it overflow
        const cellSize = cellSizeOptions[0];
        // This is pretty hacky but we expect a fixed cell size here. If we can spare the room we want to expose the top row.
        // If we don't we want to partially overlap the top row:
        // Special case is Maximized mode where we want to reserve as much vertical space as possible for the stage.
        // Note: assuming BOTTOM_TOOLBAR_HEIGHT is the roomBottomMargin
        let visibleSubgridHeight = isMaximizeMode
            ? BOTTOM_TOOLBAR_HEIGHT
            : BOTTOM_TOOLBAR_HEIGHT +
              cellPaddings.top +
              (isConstrained || isSmallScreen ? cellSize / 2 : cellSize) +
              cellPaddings.bottom;
        // If we're on super vertically constrained devices (embed and phone landscape) only give up enough to show there is a grid
        if (containerBounds.height - visibleSubgridHeight < MIN_GRID_HEIGHT) {
            visibleSubgridHeight = 0;
        }
        _containerBounds = makeBounds({
            width: containerBounds.width,
            height: visibleSubgridHeight,
        });
    } else {
        // We have a stage:
        if (isMaximizeMode) {
            // We know we're portrait when maximized and we know the cell size is the largest. Give up just one row or force layout to overflow:
            _containerBounds = makeBounds({
                width: containerBounds.width,
                height: cellSizeOptions[0] + cellPaddings.top + cellPaddings.bottom,
            });
        } else {
            // Give up to half the screen to the subgrid:
            _containerBounds = isPortrait
                ? makeBounds({ width: containerBounds.width, height: containerBounds.height / 2 })
                : makeBounds({ width: containerBounds.width / 2, height: containerBounds.height });
        }
    }

    // Limit grid width to something sane (on very wide monitors)
    let leftSubgridPadding = 0;
    if (_containerBounds.width > maxGridWidth) {
        leftSubgridPadding = (_containerBounds.width - maxGridWidth) / 2;
    }
    const subgridLayout = calculateSubgridLayout({
        containerBounds: _containerBounds,
        isPortrait,
        cellCount: subgridVideos.length,
        cellSizeOptions,
        cellPaddings,
        // When overflowing, inset cells from the top to make room for the room overflow backdrop:
        paddings: makeBox({ top: topSubgridPadding, left: leftSubgridPadding, right: leftSubgridPadding }),
    });

    // Figure out if we're overflowing our container bounds:
    const overflowNeedBounds = makeBounds({
        width: subgridLayout.contentBounds.width - _containerBounds.width,
        height: subgridLayout.contentBounds.height - _containerBounds.height,
    });
    const hasOverflow = overflowNeedBounds.width > 0 || overflowNeedBounds.height > 0;

    let subgridBounds = null;
    if (!hasVideos || shouldOverflowSubgrid || hasOverflow) {
        // Empty stage - we have to take care to allow it to overflow
        // Or if we can't fit into the bounds we picked or we're in a room overflow mode make the
        // container match the real content bounds:
        subgridBounds = subgridLayout.contentBounds;
    } else {
        subgridBounds = subgridLayout.bounds;
    }

    // Calculate video container frame based on what's left from subgrid:
    // - if we can overflow, take up all but what we originally asked for and let it append the rest
    // - if we can't overflow, take up what's left
    let videosContainerBounds;
    let _subgridContainerShareBounds = subgridBounds;
    if (hasVideos) {
        // Figure out how much of the original containerBounds we want to give up to subgrid and give up the rest to video stage
        if (shouldOverflowSubgrid) {
            // We know it's portrait always
            _subgridContainerShareBounds = makeBounds({
                width: 0,
                height: _containerBounds.height + topSubgridPadding + gridGap,
            });
        } else {
            _subgridContainerShareBounds = isPortrait
                ? makeBounds({ width: 0, height: subgridLayout.bounds.height + gridGap })
                : makeBounds({ width: subgridLayout.bounds.width + gridGap, height: 0 });
        }
        // Substract subgrid and grid gap from container bounds to get the video containers bounds:
        videosContainerBounds = insetBounds({
            bounds: _subgridContainerShareBounds,
            fromBounds: containerBounds,
        });
    } else {
        videosContainerBounds = makeBounds();
    }
    const videosContainerOrigin = { ...containerOrigin };

    // Position subgrid based on videosContainer
    let subgridOrigin;
    if (hasVideos) {
        subgridOrigin = makeOrigin({
            top: isPortrait
                ? Math.max(containerOrigin.top + height - _subgridContainerShareBounds.height + gridGap, 0)
                : containerOrigin.top,
            left: isPortrait ? containerOrigin.left : Math.max(containerOrigin.left + width - subgridBounds.width, 0),
        });
    } else {
        // Absolutely center subgrid when alone on stage
        subgridOrigin = makeOrigin({
            top: containerOrigin.top + Math.max(0, (height - subgridBounds.height) / 2),
            left: containerOrigin.left + Math.max(0, (width - subgridBounds.width) / 2),
        });
    }

    return {
        isPortrait,
        videosContainer: makeFrame({ ...videosContainerBounds, ...videosContainerOrigin }),
        subgrid: {
            ...makeFrame({ ...subgridBounds, ...subgridOrigin }),
            cells: subgridLayout.videoCells.map((cell, index) => ({
                ...cell,
                paddings: makeBox(),
                clientId: subgridVideos[index]?.clientId,
            })),
            contentBounds: subgridLayout.contentBounds,
        },
        hasOverflow: hasOverflow || shouldOverflowSubgrid || hasConstrainedOverflow,
        // Don't claim back any space if we're in a room overflow state:
        overflowNeedBounds: shouldOverflowSubgrid ? makeBounds() : overflowNeedBounds,
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
    isBreakoutNoGroupMode,
}: {
    containerBounds: Bounds;
    containerOrigin: Origin;
    gridGap: number;
    supersizedContentAspectRatio?: number;
    hasPresentationContent: boolean;
    hasPresentationGrid: boolean;
    hasVideoContent: boolean;
    minGridBounds: Bounds;
    isBreakoutNoGroupMode: boolean;
}): VideosContainerLayout {
    const { width, height } = containerBounds;
    let isPortrait = width <= height;

    let presentationGridBounds = makeBounds();
    let presentationGridOrigin = makeOrigin();
    let videoGridBounds = hasVideoContent ? { ...containerBounds } : makeBounds();
    let videoGridOrigin = hasVideoContent ? { ...containerOrigin } : makeOrigin();

    if (hasPresentationContent) {
        if (isBreakoutNoGroupMode) {
            // If we're in a breakout session and not in a group, render the broadcast stage
            // This is the inverse of the regular layout where we give most space to the presentation grid
            isPortrait = true;
            presentationGridBounds = makeBounds({
                width: containerBounds.width,
                height: minGridBounds.height + gridGap,
            });
            presentationGridOrigin = { ...containerOrigin };
            videoGridBounds = makeBounds({
                width: containerBounds.width,
                height: containerBounds.height - presentationGridBounds.height - gridGap,
            });
            videoGridOrigin = makeOrigin({
                top: containerOrigin.top + presentationGridBounds.height + gridGap,
                left: containerOrigin.left,
            });
        } else {
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
                    top: isPortrait
                        ? containerOrigin.top + presentationGridBounds.height + gridGap
                        : containerOrigin.top,
                    left: isPortrait
                        ? containerOrigin.left
                        : containerOrigin.left + presentationGridBounds.width + gridGap,
                });
            }
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
    paddings: Box;
    videos: Video[];
    isConstrained: boolean;
    maxGridWidth: number;
    gridGap: number;
}) {
    const { width, height } = containerBounds;
    const cappedWidth = maxGridWidth ? Math.min(width, maxGridWidth) : width;
    const cellCount = videos.length;

    let gridLayout: GridLayout | CenterGridLayout;
    let videoCells: VideoCell[] = [];

    if (isConstrained) {
        const constrainedGridLayout = constrainedGrid.calculateLayout({
            width,
            height,
            cellCount,
            gridGap,
            paddings,
        });

        const isSmallCell = cellCount > 4;

        videoCells = videos.map((video, index) => {
            const cellProps = constrainedGrid.getCellPropsAtIndexForLayout({ index, layout: constrainedGridLayout });

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
                aspectRatio: cellProps.width / cellProps.height,
                isSmallCell,
            };
        });
        gridLayout = constrainedGridLayout;
    } else {
        const cellAspectRatios = videos.map((video) => video.aspectRatio);
        const minGridBounds = getMinGridBounds({ cellCount });
        // Cap grid to a sane width (on very wide monitors)
        const centerGridLayout = centerGrid.calculateLayout({
            width: cappedWidth,
            height,
            cellCount,
            gridGap,
            cellAspectRatios,
            paddings,
        });

        videoCells = videos.map((video, index) => {
            const cellProps = centerGrid.getCellPropsAtIndexForLayout({ index, layout: centerGridLayout });
            const isSmallCell = centerGridLayout.cellWidth < minGridBounds.width;
            const shouldZoom = isConstrained || isSmallCell;
            const aspectRatio = shouldZoom
                ? centerGridLayout.cellWidth / centerGridLayout.cellHeight
                : video.aspectRatio;

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
        gridLayout = centerGridLayout;
    }

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
    floatingVideo?: Video;
    videoControlsHeight: number;
    margin?: number;
}) {
    if (!floatingVideo) {
        return;
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
    const videoCell: VideoCell = {
        clientId: floatingVideo.clientId,
        isDraggable: floatingVideo.isDraggable,
        origin,
        bounds,
        aspectRatio: floatingVideo.aspectRatio,
        isSmallCell: true,
    };
    return videoCell;
}

interface Pad {
    vertical: number;
    horizontal: number;
}
function rebalanceLayoutPaddedAreas({
    a,
    b,
    gridGap,
    isPortrait,
}: {
    a: Pad;
    b: Pad;
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

function rebalanceLayoutInPlace({
    videosContainerLayout,
    gridLayout,
    presentationGridLayout,
    stageLayout,
    gridGap,
    isBreakoutNoGroupMode,
    shouldOverflowSubgrid,
}: {
    videosContainerLayout: VideosContainerLayout;
    gridLayout: GridLayout;
    presentationGridLayout: GridLayout;
    stageLayout: CalculatedStageLayout;
    gridGap: number;
    isBreakoutNoGroupMode: boolean;
    shouldOverflowSubgrid: boolean;
}) {
    const hasPresentationGrid = videosContainerLayout.presentationGrid.bounds.width > 0;
    const hasVideoGrid = videosContainerLayout.videoGrid.bounds.width > 0;
    const hasSubgrid = stageLayout.subgrid.bounds.width > 0;

    const videoGridRebalanceOffset = { vertical: 0, horizontal: 0 };

    // Rebalance video containers if we have both presentationGrid and videoGrid bounds,
    // unless we have a breakout no group stage:
    if (hasPresentationGrid && hasVideoGrid && !isBreakoutNoGroupMode) {
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

    // Rebalance stage layout if we have subgrid bounds (unless it's overflown):
    if (hasSubgrid && (hasPresentationGrid || hasVideoGrid) && !shouldOverflowSubgrid) {
        const presentationGridArea = {
            horizontal: presentationGridLayout.extraHorizontalPadding,
            vertical: presentationGridLayout.extraVerticalPadding,
        };
        const gridArea = {
            // Takes into account how much if any we moved the grid over in the previous phase:
            horizontal: gridLayout.extraHorizontalPadding + videoGridRebalanceOffset.horizontal,
            vertical: gridLayout.extraVerticalPadding + videoGridRebalanceOffset.vertical,
        };

        let area;
        const hasBothGrids = hasPresentationGrid && hasVideoGrid;
        if (hasBothGrids && videosContainerLayout.isPortrait && !stageLayout.isPortrait) {
            // Special case: video containers are stacked and subgrid is on the right,
            // take the one with the smallest padding:
            area = presentationGridArea.horizontal < gridArea.horizontal ? presentationGridArea : gridArea;
        } else if (hasBothGrids && !videosContainerLayout.isPortrait && stageLayout.isPortrait) {
            // Special case: video containers are next to each other and subgrid is on the bottom,
            // take the one with the smallest padding:
            area = presentationGridArea.vertical < gridArea.vertical ? presentationGridArea : gridArea;
        } else if (hasVideoGrid) {
            area = gridArea;
        } else {
            area = presentationGridArea;
        }

        const correction = rebalanceLayoutPaddedAreas({
            a: area,
            b: {
                // Subgrid is not expected to have padding ever:
                horizontal: 0,
                vertical: 0,
            },
            gridGap,
            isPortrait: stageLayout.isPortrait,
        });

        // Update in place:
        if (stageLayout.isPortrait) {
            stageLayout.subgrid.origin.top -= correction.b;
        } else {
            stageLayout.subgrid.origin.left -= correction.b;
        }
    }
}
interface Paddings {
    presentationGrid: number;
    grid: number;
}
function redistributeEmptySpaceToSubgridInPlace({
    vPaddings,
    hPaddings,
    stageLayout,
    videosContainerLayout,
}: {
    vPaddings: Paddings;
    hPaddings: Paddings;
    stageLayout: CalculatedStageLayout;
    videosContainerLayout: VideosContainerLayout;
}) {
    // Redistribute empty space to subgrid in place:
    if (stageLayout.isPortrait && (vPaddings.presentationGrid || vPaddings.grid)) {
        const totalVPadding = videosContainerLayout.isPortrait
            ? vPaddings.presentationGrid * 2 + vPaddings.grid * 2
            : vPaddings.presentationGrid + vPaddings.grid;
        stageLayout.videosContainer.bounds.height -= totalVPadding;
        stageLayout.subgrid.origin.top -= totalVPadding;
        stageLayout.subgrid.bounds.height += totalVPadding;

        videosContainerLayout.presentationGrid.bounds.height -= vPaddings.presentationGrid * 2;
        videosContainerLayout.videoGrid.bounds.height -= vPaddings.grid * 2;
        if (videosContainerLayout.isPortrait) {
            videosContainerLayout.videoGrid.origin.top -= vPaddings.presentationGrid;
        }
    }

    if (!stageLayout.isPortrait && (hPaddings.presentationGrid || hPaddings.grid)) {
        const totalHPadding = videosContainerLayout.isPortrait
            ? hPaddings.presentationGrid + hPaddings.grid
            : hPaddings.presentationGrid * 2 + hPaddings.grid * 2;
        stageLayout.videosContainer.bounds.width -= totalHPadding;
        stageLayout.subgrid.origin.left -= totalHPadding;
        stageLayout.subgrid.bounds.width += totalHPadding;

        videosContainerLayout.presentationGrid.bounds.width -= hPaddings.presentationGrid * 2;
        videosContainerLayout.videoGrid.bounds.width -= hPaddings.grid * 2;
        if (!videosContainerLayout.isPortrait) {
            videosContainerLayout.videoGrid.origin.left -= hPaddings.grid;
        }
    }
}

function findGridsEmptySpaceToRedistribute({
    need = makeBounds(),
    stageLayout,
    gridLayout,
    presentationGridLayout,
    videosContainerLayout,
}: {
    need?: Bounds;
    stageLayout: CalculatedStageLayout;
    gridLayout: GridLayout;
    presentationGridLayout: {
        extraHorizontalPadding: number;
        extraVerticalPadding: number;
    };
    videosContainerLayout: VideosContainerLayout;
}) {
    let vPaddings: Paddings = { presentationGrid: 0, grid: 0 };
    let hPaddings: Paddings = { presentationGrid: 0, grid: 0 };

    if (stageLayout.isPortrait) {
        const minDim = Math.min(gridLayout.extraVerticalPadding, presentationGridLayout.extraVerticalPadding);
        vPaddings = {
            presentationGrid: Math.min(
                videosContainerLayout.isPortrait ? presentationGridLayout.extraVerticalPadding : minDim,
                need.height
            ),
            grid: Math.min(videosContainerLayout.isPortrait ? gridLayout.extraVerticalPadding : minDim, need.height),
        };
    } else {
        const minDim = Math.min(gridLayout.extraHorizontalPadding, presentationGridLayout.extraHorizontalPadding);
        hPaddings = {
            presentationGrid: Math.min(
                videosContainerLayout.isPortrait ? minDim : presentationGridLayout.extraHorizontalPadding,
                need.width
            ),
            grid: Math.min(videosContainerLayout.isPortrait ? minDim : gridLayout.extraHorizontalPadding, need.width),
        };
    }
    return { vPaddings, hPaddings };
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
}: {
    gridGap: number;
    isConstrained: boolean;
    presentationVideos: Video[];
    videos: Video[];
    videosContainerLayout: VideosContainerLayout;
    gridLayoutPaddings?: Box;
    presentationGridLayoutPaddings?: Box;
    maxGridWidth: number;
}) {
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

export function calculateLayout({
    breakoutActive = false,
    breakoutGroupedClients = [],
    breakoutStagePaddings = makeBox(),
    floatingVideo,
    frame,
    gridGap,
    isConstrained,
    isMaximizeMode = false,
    isXLMeetingSize = false,
    paddings = makeBox(),
    presentationVideos = [],
    rebalanceLayout = false,
    roomBounds,
    roomLayoutHasOverflow = false,
    subgridCellPaddings = SUBGRID_CELL_PADDING_BOX,
    subgridVideos = [],
    videoControlsHeight = 0,
    videos = [],
    videoGridGap,
}: {
    breakoutActive: boolean;
    breakoutGroupedClients: { clients: unknown[] }[];
    breakoutStagePaddings: Box;
    floatingVideo?: Video;
    frame: Frame;
    gridGap: number;
    isConstrained: boolean;
    isMaximizeMode: boolean;
    isXLMeetingSize: boolean;
    paddings: Box;
    presentationVideos: Video[];
    rebalanceLayout: boolean;
    roomBounds: Bounds;
    roomLayoutHasOverflow: boolean;
    subgridCellPaddings: Box;
    subgridVideos: Video[];
    videoControlsHeight: number;
    videos: Video[];
    videoGridGap: number;
}): StageLayout {
    let shouldOverflowSubgrid = isXLMeetingSize && (screen ? screen.width <= 2048 : true); // If we're on really large monitors don't force overflow
    const isBreakoutNoGroupMode = !!breakoutGroupedClients.length;
    const hasPresentationContent = !!presentationVideos.length;
    const hasPresentationGrid = presentationVideos.length > 1;
    const supersizedContentAspectRatio =
        hasPresentationContent && !hasPresentationGrid ? presentationVideos[0].aspectRatio : undefined;
    const hasVideoContent = !!videos.length;
    const width = frame.bounds.width - paddings.left - paddings.right;
    let height = frame.bounds.height - paddings.top - paddings.bottom;
    const maxGridWidth = Math.max(25 * 88, (80 / 100) * width); // go up to 80vw after a sane max width

    // On mobile, we set a hard limit on 12 videos, and overflows after that.
    const hasConstrainedOverflow = isConstrained && !breakoutActive && videos.length > CONSTRAINED_OVERFLOW_TRIGGER;
    const lineHeight = height / 4;
    const extraLines = Math.ceil((videos.length - CONSTRAINED_OVERFLOW_TRIGGER) / 3);

    height = hasConstrainedOverflow ? height + lineHeight * extraLines : height;

    const stageBounds = makeBounds({ width, height });
    const stageOrigin = makeOrigin({ top: paddings.top, left: paddings.left });
    const _minBounds = getMinGridBounds({ cellCount: videos.length });
    const minGridBounds = isBreakoutNoGroupMode
        ? makeBounds({
              width: _minBounds.width,
              height: _minBounds.height + breakoutStagePaddings.top + breakoutStagePaddings.bottom,
          })
        : _minBounds;
    // We curently only use this for making the overflown subgrid responsive. Might make sense to pass in the
    // responsive layout object in place of isConstrained etc flags:
    const isSmallScreen = roomBounds.width < TABLET_BREAKPOINT || roomBounds.height < TABLET_BREAKPOINT;

    const forceStageLayoutPortrait = isBreakoutNoGroupMode || isMaximizeMode;
    const stageLayoutIsPortrait =
        forceStageLayoutPortrait ||
        shouldOverflowSubgrid ||
        !(hasPresentationContent || hasVideoContent) ||
        stageBounds.width <= stageBounds.height;

    const stableStageLayoutProps = {
        cellPaddings: subgridCellPaddings,
        containerBounds: stageBounds,
        containerOrigin: stageOrigin,
        gridGap,
        hasPresentationContent,
        hasVideoContent,
        isConstrained,
        isMaximizeMode,
        isSmallScreen,
        subgridVideos,
        maxGridWidth,
    };

    let stageLayout = calculateStageLayout({
        ...stableStageLayoutProps,
        cellSizeOptions: getSubgridSizeOptions({
            hasOverflow: shouldOverflowSubgrid,
            hasStage: hasPresentationContent || hasVideoContent,
        }),
        isPortrait: stageLayoutIsPortrait,
        shouldOverflowSubgrid,
        hasConstrainedOverflow,
    });

    // Prevent yo-yo-ing between overflow and non overflow states:
    // - if we're not in a forced overflow state and main room layout has overflow already (prev we could not fit) and now we can fit,
    // - double check by re-running the stage layout with the non overflow bounds:
    let forceRerunAsOverflow = false;
    if (!shouldOverflowSubgrid && roomLayoutHasOverflow && !stageLayout.hasOverflow) {
        const _stageLayout = calculateStageLayout({
            ...stableStageLayoutProps,
            containerBounds: makeBounds({
                width: stageBounds.width,
                height: stageBounds.height - BOTTOM_TOOLBAR_HEIGHT, // override "stable" prop
            }),
            cellSizeOptions: getSubgridSizeOptions({
                hasOverflow: shouldOverflowSubgrid,
                hasStage: hasPresentationContent || hasVideoContent,
            }),
            isPortrait: stageLayoutIsPortrait,
            shouldOverflowSubgrid,
            hasConstrainedOverflow,
        });
        // If it turns out we can't fit, force re-layout as overflow:
        if (_stageLayout.hasOverflow) {
            forceRerunAsOverflow = true;
        }
    }

    // If subgrid cannot fit, re-run the stage layout in overflow:
    if (forceRerunAsOverflow || (stageLayout.hasOverflow && !shouldOverflowSubgrid)) {
        shouldOverflowSubgrid = true;
        stageLayout = calculateStageLayout({
            ...stableStageLayoutProps,
            cellSizeOptions: getSubgridSizeOptions({
                hasOverflow: true,
                hasStage: hasPresentationContent || hasVideoContent,
            }),
            isPortrait: true,
            shouldOverflowSubgrid,
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
        isBreakoutNoGroupMode,
    });

    let { gridLayout, presentationGridLayout } = calculateGridLayouts({
        gridGap: videoGridGap,
        isConstrained,
        presentationVideos,
        videos,
        videosContainerLayout,
        ...(isBreakoutNoGroupMode ? { presentationGridLayoutPaddings: breakoutStagePaddings } : {}),
        maxGridWidth,
    });

    let groupsLayout: StageLayoutGroups | undefined = undefined;
    undefined;
    if (isBreakoutNoGroupMode) {
        // Expecting a single cell representing the breakout groups grid. Run the cell layout manually and pass it through
        // to be injected in the video cell itself (VideoStage):
        groupsLayout = groupsGrid.calculateLayout({
            avatarSizes: [60, 40, 32],
            cellCount: breakoutGroupedClients.length,
            width: gridLayout.videoCells[0].bounds.width,
            height: gridLayout.videoCells[0].bounds.height,
            maxClientCount: breakoutGroupedClients.reduce(
                (acc: number, group) => Math.max(acc, group.clients.length),
                0
            ),
        });
        if (groupsLayout.isConstrained) {
            groupsLayout = groupsTable.calculateLayout({
                cellCount: breakoutGroupedClients.length,
                width: videosContainerLayout.videoGrid.bounds.width,
                height: videosContainerLayout.videoGrid.bounds.height,
            });
        }
        // Until we inline the groups layout we have to extract the empty space information and feed it into the grid manually
        gridLayout.extraVerticalPadding = groupsLayout.extraVerticalPadding ?? 0;
        // We expect a single video cell that represents the groups, size appropriately:
        gridLayout.videoCells[0].bounds = groupsLayout.bounds;
        gridLayout.videoCells[0].aspectRatio =
            gridLayout.videoCells[0].bounds.width / gridLayout.videoCells[0].bounds.height;
    }

    // If subgrid needs more room from layout try to recover it from the video grids:
    if (stageLayout.hasOverflow && !shouldOverflowSubgrid) {
        const { vPaddings, hPaddings } = findGridsEmptySpaceToRedistribute({
            need: stageLayout.overflowNeedBounds,
            stageLayout,
            gridLayout,
            presentationGridLayout,
            videosContainerLayout,
        });

        if (vPaddings.presentationGrid || vPaddings.grid || hPaddings.presentationGrid || hPaddings.grid) {
            // If we have any wasted space in the grids, redistribute back to subgrid:
            redistributeEmptySpaceToSubgridInPlace({ vPaddings, hPaddings, stageLayout, videosContainerLayout });
            // Now we have to re-layout the video cells in the adjusted containers:
            ({ gridLayout, presentationGridLayout } = calculateGridLayouts({
                gridGap: videoGridGap,
                isConstrained,
                presentationVideos,
                videos,
                videosContainerLayout,
                maxGridWidth,
            }));
        }
    }

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
            stageLayout,
            gridGap,
            isBreakoutNoGroupMode,
            shouldOverflowSubgrid,
        });
    }

    // Calculate overflown bounds:
    let overflowBoundsHeight =
        paddings.top + stageLayout.videosContainer.bounds.height + stageLayout.subgrid.bounds.height + paddings.bottom;
    if (hasPresentationContent || hasVideoContent) {
        overflowBoundsHeight += gridGap;
    }
    const floatingContent =
        floatingLayout && floatingVideo
            ? {
                  ...floatingLayout,
                  ...floatingVideo,
              }
            : undefined;

    return {
        isPortrait: stageLayout.isPortrait,
        hasOverflow: stageLayout.hasOverflow,
        bounds: makeBounds({
            height: shouldOverflowSubgrid ? overflowBoundsHeight : frame.bounds.height,
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
        subgrid: stageLayout.subgrid,
        floatingContent,
        groups: groupsLayout,
        videosContainer: stageLayout.videosContainer,
    };
}
