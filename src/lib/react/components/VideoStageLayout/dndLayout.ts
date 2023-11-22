import { fitToBounds, fitToFrame } from "./VideoGrid/gridUtils";

import { makeOrigin, makeBox, Origin, Box, VideoCell, Frame, Bounds, StageLayout } from "../helpers/layout";
import { Coordinates } from "./useDrag";

function originToAbsOrigin({
    origin,
    containerOrigin,
    paddings = makeBox(),
}: {
    origin: Origin;
    containerOrigin: Origin;
    paddings?: Box;
}) {
    return makeOrigin({
        top: containerOrigin.top + paddings.top + origin.top,
        left: containerOrigin.left + paddings.left + origin.left,
    });
}

function cellToAbsCell({
    cell,
    containerFrame,
    containerPaddings = makeBox(),
}: {
    cell: VideoCell;
    containerFrame: Frame;
    containerPaddings: Box;
}) {
    const cellAbsOrigin = originToAbsOrigin({
        origin: cell.origin,
        containerOrigin: containerFrame.origin,
        paddings: containerPaddings,
    });
    return { ...cell, origin: cellAbsOrigin };
}

export function buildDragIndicator({ cell, delta: [deltaX, deltaY] }: { cell: VideoCell; delta: Coordinates }) {
    const offsetOrigin = makeOrigin({
        top: cell.origin.top - deltaY,
        left: cell.origin.left - deltaX,
    });
    const dragIndicator = {
        cell,
        frame: fitToFrame({
            contentAspectRatio: cell.aspectRatio,
            containerFrame: {
                origin: offsetOrigin,
                bounds: cell.bounds,
            },
        }),
    };
    return dragIndicator;
}

export function buildDropIndicator({ cell }: { cell: VideoCell }) {
    const dropIndicator = {
        cell,
        frame: fitToFrame({
            contentAspectRatio: cell.aspectRatio,
            containerFrame: {
                origin: cell.origin,
                bounds: cell.bounds,
            },
        }),
    };

    return dropIndicator;
}

function hitTest({ cell, xy: [x, y], hitBuffer = 0 }: { cell: VideoCell; xy: Coordinates; hitBuffer?: number }) {
    if (
        x >= cell.origin.left - hitBuffer &&
        x <= cell.origin.left + cell.bounds.width + hitBuffer &&
        y >= cell.origin.top - hitBuffer &&
        y <= cell.origin.top + cell.bounds.height + hitBuffer
    ) {
        return true;
    }

    return false;
}

export function testCell({
    cell,
    draggedClientId,
    xy,
    delta,
    hitBuffer,
    yOffset = 0,
}: {
    cell: VideoCell;
    draggedClientId: string;
    xy: Coordinates;
    delta: Coordinates;
    hitBuffer?: number;
    yOffset?: number;
}) {
    let dragIndicator = null;
    let dropIndicator = null;

    // Account of vertical offset (window.scrollY usually)
    if (yOffset) {
        cell.origin.top -= yOffset;
    }

    if (cell.clientId === draggedClientId) {
        dragIndicator = buildDragIndicator({ cell, delta });
    } else if (hitTest({ cell, xy, hitBuffer })) {
        dropIndicator = buildDropIndicator({ cell });
    }

    return { dragIndicator, dropIndicator };
}

// Size cell to fit in {targetBounds} while keeping the origin
// proportional to the given drag point:
export function reframeIndicatorAroundPoint({
    indicator,
    xy: [x, y],
    targetBounds,
}: {
    indicator: { frame: Frame; cell: VideoCell };
    xy: Coordinates;
    targetBounds: Bounds;
}) {
    // Figure out % coordinates where we clicked in original rect
    const percentX = (indicator.frame.origin.left - x) / indicator.frame.bounds.width;
    const percentY = (indicator.frame.origin.top - y) / indicator.frame.bounds.height;
    // Re-frame indicator to fit new bounds
    const resizedBounds = fitToBounds(indicator.cell.aspectRatio, targetBounds);
    const reframedOrigin = makeOrigin({
        top: y + resizedBounds.height * percentY,
        left: x + resizedBounds.width * percentX,
    });
    return {
        ...indicator,
        frame: {
            origin: reframedOrigin,
            bounds: resizedBounds,
        },
    };
}

export function calculateDndIndicatorsLayout({
    stageOrigin,
    stageLayout,
    xy,
    delta,
    draggedClientId,
    isMaximizeMode,
    yOffset = 0,
}: {
    stageOrigin: Origin;
    stageLayout: StageLayout;
    xy: Coordinates;
    delta: Coordinates;
    draggedClientId: string;
    isMaximizeMode: boolean;
    yOffset?: number;
}) {
    const hasPresentationGrid = stageLayout.presentationGrid?.cells.length > 1;
    const draggedClientIsPresentation = hasPresentationGrid
        ? !!stageLayout.presentationGrid.cells.find((cell) => cell.clientId === draggedClientId)
        : false;
    const gridLayout =
        hasPresentationGrid && draggedClientIsPresentation ? stageLayout.presentationGrid : stageLayout.videoGrid;
    const cells = gridLayout.cells.filter((cell) => cell.isDraggable);
    const supersizedContent =
        stageLayout.presentationGrid?.cells.length === 1 ? stageLayout.presentationGrid.cells[0] : null;

    let dragIndicator = null;
    let dropIndicator = null;
    let done = false;
    let matchIsSupersized = false;

    // Because we know the intention of the drag is to swap video cells,
    // extend the hit test cell frame by half the gridGap - effectively
    // removing the grid gap - to maximize hit rate and make it feel not glitchy:
    const hitBuffer = Math.round(stageLayout.gridGap / 2);

    for (let i = 0; i < cells.length; i++) {
        // Test grid video cells
        const cell = cells[i];
        const gridAbsOrigin = originToAbsOrigin({
            origin: gridLayout.origin,
            containerOrigin: stageOrigin,
        });
        const absCell = cellToAbsCell({
            cell,
            containerFrame: { bounds: gridLayout.bounds, origin: gridAbsOrigin },
            containerPaddings: gridLayout.paddings,
        });

        const results = testCell({ cell: absCell, draggedClientId, xy, delta, hitBuffer, yOffset });

        if (results.dragIndicator) {
            dragIndicator = results.dragIndicator;
        } else if (results.dropIndicator) {
            dropIndicator = results.dropIndicator;
        }

        done = !!(dragIndicator && dropIndicator);

        if (done) {
            break;
        }
    }

    if (!done && isMaximizeMode && supersizedContent?.isDraggable) {
        // Test supersized video cell
        const cell = {
            clientId: supersizedContent.clientId,
            aspectRatio:
                supersizedContent.aspectRatio || supersizedContent.bounds.width / supersizedContent.bounds.height,
            origin: supersizedContent.origin,
            bounds: supersizedContent.bounds,
        };
        const presentationGridAbsOrigin = originToAbsOrigin({
            origin: stageLayout.presentationGrid.origin,
            containerOrigin: stageOrigin,
        });
        const absCell = cellToAbsCell({
            cell,
            containerFrame: { bounds: stageLayout.presentationGrid.bounds, origin: presentationGridAbsOrigin },
            containerPaddings: stageLayout.presentationGrid.paddings,
        });

        const results = testCell({ cell: absCell, draggedClientId, xy, delta });

        if (results.dragIndicator) {
            dragIndicator = results.dragIndicator;
        } else if (results.dropIndicator) {
            dropIndicator = results.dropIndicator;
        }

        done = !!(dragIndicator && dropIndicator);
        matchIsSupersized = done;
    }

    if (done && matchIsSupersized && dragIndicator && dropIndicator) {
        // If we have a match, re-frame dragIndicator to indicate cell size after drop:
        // Only matters for supersized <> unsupersized because all the other cells
        // are the same size
        dragIndicator = reframeIndicatorAroundPoint({
            indicator: dragIndicator,
            xy,
            targetBounds: dropIndicator.cell.bounds,
        });
    }

    return {
        dragIndicator,
        dropIndicator,
    };
}
