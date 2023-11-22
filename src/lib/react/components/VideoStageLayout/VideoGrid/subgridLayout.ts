import { Bounds, Box, Layout, makeBox } from "../../helpers/layout";

// Calculate how much we need to move the incomplete row/col so it becomes centered:
function getCenterPadding({
    index,
    isPortrait,
    rows,
    cols,
    cellBounds,
    cellCount,
}: {
    index: number;
    isPortrait: boolean;
    rows: number;
    cols: number;
    cellBounds: Bounds;
    cellCount: number;
}) {
    const canFit = rows * cols;
    const leftOver = canFit - cellCount;
    // Do nothing if we have a perfectly filled grid:
    if (!leftOver) {
        return 0;
    }

    const lastIndex = canFit - leftOver - 1;
    const dimension = isPortrait ? cols : rows;
    const firstIndex = lastIndex - (dimension - leftOver) + 1;

    // Do nothing if the index is not in the incomplete row:
    if (index < firstIndex || index > lastIndex) {
        return 0;
    }
    return (leftOver * (isPortrait ? cellBounds.width : cellBounds.height)) / 2;
}

export function calculateLayout({
    containerBounds,
    isPortrait,
    cellCount,
    cellBounds,
    paddings = makeBox(),
}: {
    containerBounds: Bounds;
    isPortrait: boolean;
    cellCount: number;
    cellBounds: Bounds;
    paddings: Box;
}) {
    let width = 0;
    let height = 0;
    let rows = 0;
    let cols = 0;
    let extraHorizontalPadding = 0;
    let extraVerticalPadding = 0;

    const contentWidth = containerBounds.width - paddings.left - paddings.right;
    const contentHeight = containerBounds.height - paddings.top - paddings.bottom;

    if (cellCount) {
        if (isPortrait) {
            // Portrait layout, subgrid fills container width:
            cols = Math.floor(contentWidth / cellBounds.width);
            rows = Math.ceil(cellCount / cols);
            width = contentWidth;
            height = rows * cellBounds.height;
            extraHorizontalPadding = (contentWidth - cols * cellBounds.width) / 2;
        } else {
            // Landscape layout, subgrid fills container height:
            rows = Math.floor(contentHeight / cellBounds.height);
            cols = Math.ceil(cellCount / rows);
            width = cols * cellBounds.width;
            height = contentHeight;
            extraVerticalPadding = (contentHeight - rows * cellBounds.height) / 2;
        }
    }

    return {
        isPortrait,
        width: width + paddings.left + paddings.right,
        height: height + paddings.top + paddings.bottom,
        cellBounds,
        cellCount,
        rows,
        cols,
        extraHorizontalPadding,
        extraVerticalPadding,
        paddings,
    };
}

export function getCellPropsAtIndexForLayout({ index, layout }: { index: number; layout: Layout }) {
    const { isPortrait, rows, cols, cellCount, cellBounds, extraHorizontalPadding, extraVerticalPadding, paddings } =
        layout;
    const top = isPortrait ? Math.floor(index / cols) : Math.floor(index % rows);
    const left = isPortrait ? Math.floor(index % cols) : Math.floor(index / rows);

    const centerPadding = getCenterPadding({ index, isPortrait, rows, cols, cellBounds, cellCount });

    return {
        top: paddings.top + extraVerticalPadding + top * cellBounds.height + (isPortrait ? 0 : centerPadding),
        left: paddings.left + extraHorizontalPadding + left * cellBounds.width + (isPortrait ? centerPadding : 0),
        width: cellBounds.width,
        height: cellBounds.height,
    };
}
