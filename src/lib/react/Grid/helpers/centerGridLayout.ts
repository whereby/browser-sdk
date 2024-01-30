import { getGridSizeForCount } from "./gridUtils";

import { Box, makeBox } from "./layout";

const WIDE_AR = 16 / 9;
const NORMAL_AR = 4 / 3;

const clamp = ({ value, min, max }: { value: number; min: number; max: number }) => Math.min(Math.max(value, min), max);

function hasDuplicates<T>(...array: T[]) {
    return new Set(array).size !== array.length;
}

function findMostCommon<T>(arr: T[]) {
    return arr.sort((a, b) => arr.filter((v) => v === a).length - arr.filter((v) => v === b).length).pop();
}

// Grid cells are all the same aspect ratio (not to be confused with the video cells)
// Pick the best ratio given a list of the video cell ratios:
export function pickCellAspectRatio({ choices = [] }: { choices: number[] }) {
    // If all cells are the same aspect ratio use that:
    const minAr = Math.min(...choices);
    const maxAr = Math.max(...choices);
    let chosenAr = null;
    if (minAr === maxAr) {
        chosenAr = minAr;
    } else {
        // Otherwise we're in a mixed grid.
        // We ideally want to make the majority ratio look nice. Pick the most common
        // ratio but limit it to wide cells. If we don't have a majority choice
        // just go with the widest:
        const dominantAr = hasDuplicates(choices) ? findMostCommon(choices) : maxAr;
        chosenAr = clamp({ value: dominantAr || maxAr, min: NORMAL_AR, max: WIDE_AR });
    }
    return {
        minAr,
        maxAr,
        chosenAr,
    };
}

// Calculate how much we need to move the last row horizontally so it
// becomes centered:
function getCenterPadding({
    rows,
    cols,
    cellWidth,
    index,
    cellCount,
    gridGap,
}: {
    rows: number;
    cols: number;
    cellWidth: number;
    index: number;
    cellCount: number;
    gridGap: number;
}) {
    const max = rows * cols;

    const leftOver = max - cellCount;

    if (!leftOver) {
        return 0;
    }

    const lastIndex = max - leftOver - 1;
    const firstIndex = lastIndex - (cols - leftOver) + 1;

    const lastRowPadding = (leftOver * cellWidth) / 2 + gridGap;

    return index >= firstIndex && index <= lastIndex ? lastRowPadding : 0;
}

function getCellBounds({
    width,
    height,
    rows,
    cols,
    gridGap,
    aspectRatio,
}: {
    width: number;
    height: number;
    rows: number;
    cols: number;
    gridGap: number;
    aspectRatio: number;
}) {
    // Naively calculate the cell size based on grid and container size:
    const cellWidth = (width - (cols - 1) * gridGap) / cols;
    const cellHeight = (height - (rows - 1) * gridGap) / rows;
    const ar = cellWidth / cellHeight;

    // Knowing the target cell aspect ratio, pull any extra space
    // into the grid padding:
    let horizontalCorrection = 0;
    let verticalCorrection = 0;

    if (aspectRatio < ar) {
        horizontalCorrection = cellWidth - cellHeight * aspectRatio;
    } else if (aspectRatio > ar) {
        verticalCorrection = cellHeight - cellWidth / aspectRatio;
    }

    const totalHorizontalCorrection = horizontalCorrection * cols;
    const totalVerticalCorrection = verticalCorrection * rows;

    return {
        cellWidth: cellWidth - horizontalCorrection,
        cellHeight: cellHeight - verticalCorrection,
        extraHorizontalPadding: totalHorizontalCorrection / 2,
        extraVerticalPadding: totalVerticalCorrection / 2,
    };
}

export function calculateLayout({
    width,
    height,
    cellCount,
    gridGap,
    cellAspectRatios = [NORMAL_AR],
    paddings = makeBox(),
}: {
    width: number;
    height: number;
    cellCount: number;
    gridGap: number;
    cellAspectRatios?: number[];
    paddings?: Box;
}) {
    // Handle empty grid:
    if (!cellCount) {
        return {
            cellCount,
            cellHeight: 0,
            cellWidth: 0,
            cols: 0,
            rows: 0,
            extraHorizontalPadding: 0,
            extraVerticalPadding: 0,
            gridGap,
            paddings,
        };
    }

    const contentWidth = width - (paddings.left + paddings.right);
    const contentHeight = height - (paddings.top + paddings.bottom);

    const cellAspectRatioTuple = pickCellAspectRatio({
        choices: cellAspectRatios,
    });
    let cellAspectRatio = cellAspectRatioTuple.chosenAr;

    const { rows, cols } = getGridSizeForCount({
        count: cellCount,
        width: contentWidth,
        height: contentHeight,
        aspectRatio: cellAspectRatio,
    });

    // Special case 1 col / row:
    // Divvy up available all space (within reason)
    if (rows === 1) {
        cellAspectRatio = clamp({
            value: contentWidth / cols / contentHeight,
            min: Math.min(cellAspectRatioTuple.chosenAr, cellAspectRatioTuple.maxAr),
            max: Math.max(cellAspectRatioTuple.chosenAr, cellAspectRatioTuple.maxAr),
        });
    } else if (cols === 1) {
        cellAspectRatio = clamp({
            value: contentWidth / (contentHeight / rows),
            min: Math.min(cellAspectRatioTuple.chosenAr, cellAspectRatioTuple.maxAr),
            max: Math.max(cellAspectRatioTuple.chosenAr, cellAspectRatioTuple.maxAr),
        });
    }

    const { cellWidth, cellHeight, extraHorizontalPadding, extraVerticalPadding } = getCellBounds({
        width: contentWidth,
        height: contentHeight,
        rows,
        cols,
        gridGap,
        aspectRatio: cellAspectRatio,
    });

    return {
        cellCount,
        cellHeight,
        cellWidth,
        cols,
        rows,
        extraHorizontalPadding,
        extraVerticalPadding,
        // pass through
        gridGap,
        paddings,
    };
}

export function getCellPropsAtIndexForLayout({
    index,
    layout,
}: {
    index: number;
    layout: ReturnType<typeof calculateLayout>;
}) {
    const { cellWidth, cellHeight, rows, cols, cellCount, gridGap } = layout;

    const top = Math.floor(index / cols);
    const left = Math.floor(index % cols);

    const leftPadding = getCenterPadding({ rows, cols, cellWidth, index, cellCount, gridGap });

    return {
        top: top * cellHeight + top * gridGap,
        left: left * cellWidth + left * gridGap + leftPadding,
        width: cellWidth,
        height: cellHeight,
    };
}
