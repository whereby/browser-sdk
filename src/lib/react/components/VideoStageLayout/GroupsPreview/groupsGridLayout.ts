import { makeBox, makeBounds, Bounds } from "../../helpers/layout";
import { default as LAYOUT_CONSTANTS } from "../../constants/layout";
const {
    GROUPS_CELL_MARGIN,
    GROUPS_CELL_PADDING,
    GROUPS_CELL_NAV_HEIGHT,
    GROUPS_CELL_AVATAR_WRAPPER_BOTTOM_MARGIN,
    GROUPS_CELL_AVATAR_GRID_GAP,
    GROUPS_CELL_MIN_WIDTH,
    GROUPS_CELL_MAX_WIDTH,
} = LAYOUT_CONSTANTS;
import { Box } from "../../helpers/layout";

const CHROME_HEIGHT =
    GROUPS_CELL_MARGIN * 2 +
    GROUPS_CELL_PADDING * 2 +
    GROUPS_CELL_NAV_HEIGHT +
    GROUPS_CELL_AVATAR_WRAPPER_BOTTOM_MARGIN;
const CHROME_WIDTH = GROUPS_CELL_MARGIN * 2 + GROUPS_CELL_PADDING * 2;

export function calculateCellLayout({
    avatarSize,
    count,
    containerWidth,
}: {
    avatarSize: number;
    count: number;
    containerWidth: number;
}) {
    const tileSize = avatarSize + GROUPS_CELL_AVATAR_GRID_GAP;
    const cols = Math.floor((containerWidth - CHROME_WIDTH) / tileSize);
    const rows = Math.max(Math.ceil(count / cols), 1);
    return {
        bounds: {
            width: CHROME_WIDTH + cols * tileSize,
            height: CHROME_HEIGHT + rows * tileSize,
        },
        cols,
        rows,
    };
}

interface GridCellLayout {
    avatarSize: number;
    bounds: Bounds;
    cellBounds: Bounds;
    cellLayout: {
        bounds: Bounds;
        cols: number;
        rows: number;
    };
    cols: number;
    extraHorizontalPadding: number;
    extraVerticalPadding: number;
    isConstrained: boolean;
    rows: number;
}
function calculateGridCellLayout({
    avatarSize,
    cellWidth,
    cellHeight,
    cols,
    height,
    maxClientCount,
    rows,
    width,
}: {
    avatarSize: number;
    cellWidth: number;
    cellHeight: number;
    cols: number;
    height: number;
    maxClientCount: number;
    rows: number;
    width: number;
}): GridCellLayout {
    const cellLayout = calculateCellLayout({ avatarSize, containerWidth: cellWidth, count: maxClientCount });
    const gridWidth = cols * cellLayout.bounds.width;
    const gridHeight = rows * cellLayout.bounds.height;
    const extraHorizontalPadding = (width - gridWidth) / 2;
    const extraVerticalPadding = (height - gridHeight) / 2;
    return {
        avatarSize,
        bounds: makeBounds({ width: gridWidth, height: gridHeight }),
        cellBounds: makeBounds({ width: cellWidth, height: cellHeight }),
        cellLayout,
        cols,
        extraHorizontalPadding,
        extraVerticalPadding,
        isConstrained: cellHeight < cellLayout.bounds.height,
        rows,
    };
}

function flexFit({
    cellCount,
    width,
    minCellWidth,
    maxCellWidth,
}: {
    cellCount: number;
    width: number;
    minCellWidth: number;
    maxCellWidth: number;
}) {
    if (minCellWidth > width) {
        return {
            cellWidth: width,
            cols: 1,
        };
    }

    const cols = Math.min(Math.floor(width / minCellWidth), cellCount);
    const extra = Math.min((width - cols * minCellWidth) / cols, maxCellWidth - minCellWidth);
    const cellWidth = minCellWidth + extra;

    return { cellWidth, cols };
}

function fitGridLayout({
    avatarSize,
    cellCount,
    maxClientCount,
    width,
    height,
}: {
    avatarSize: number;
    cellCount: number;
    maxClientCount: number;
    width: number;
    height: number;
}) {
    const { cellWidth, cols } = flexFit({
        cellCount,
        width,
        minCellWidth: GROUPS_CELL_MIN_WIDTH,
        maxCellWidth: GROUPS_CELL_MAX_WIDTH,
    });
    const rows = Math.max(Math.ceil(cellCount / cols), 1);
    const cellHeight = height / rows;

    return calculateGridCellLayout({
        avatarSize,
        cellWidth,
        cellHeight,
        cols,
        height,
        maxClientCount,
        rows,
        width,
    });
}

export function calculateLayout({
    avatarSizes,
    cellCount,
    height,
    maxClientCount,
    paddings = makeBox(),
    width,
}: {
    avatarSizes: [number, number, number];
    cellCount: number;
    height: number;
    maxClientCount: number;
    paddings?: Box;
    width: number;
}): GridCellLayout & { paddings?: Box } {
    const availableWidth = width - (paddings.left + paddings.right);
    const availableHeight = height - (paddings.top + paddings.bottom);

    // default to the smallest size, since it'll be the closest to fitting
    let gridLayout = fitGridLayout({
        avatarSize: avatarSizes[avatarSizes.length - 1],
        cellCount,
        maxClientCount,
        width: availableWidth,
        height: availableHeight,
    });
    // Assuming avatar sizes are sorted, try all options until we can fit cells vertically:
    for (let i = 0; i < avatarSizes.length; i++) {
        gridLayout = fitGridLayout({
            avatarSize: avatarSizes[i],
            cellCount,
            maxClientCount,
            width: availableWidth,
            height: availableHeight,
        });
        if (!gridLayout.isConstrained) {
            break;
        }
    }

    return {
        ...gridLayout,
        // Include paddings in final bounds:
        bounds: makeBounds({
            width, // we take up full width
            height: Math.min(gridLayout.bounds.height, availableHeight) + (paddings.top + paddings.bottom), // but only the height we need
        }),
        paddings,
    };
}
