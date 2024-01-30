import { Bounds, Frame, makeFrame } from "./layout";

export function fitToBounds(aspectRatio: number, containerSize: Bounds) {
    const { width, height } = containerSize;
    const contentHeight = height;
    const contentWidth = contentHeight * aspectRatio;
    const scale = Math.min(width / contentWidth, height / contentHeight);
    const adjustedWidth = contentWidth * scale;
    const adjustedHeight = contentHeight * scale;
    return { width: adjustedWidth, height: adjustedHeight };
}

export function fitToFrame({
    contentAspectRatio,
    containerFrame,
}: {
    contentAspectRatio: number;
    containerFrame: Frame;
}) {
    const contentBounds = fitToBounds(contentAspectRatio, {
        width: containerFrame.bounds.width,
        height: containerFrame.bounds.height,
    });

    const topOffset = (containerFrame.bounds.height - contentBounds.height) / 2;
    const leftOffset = (containerFrame.bounds.width - contentBounds.width) / 2;

    return makeFrame({
        ...contentBounds,
        top: containerFrame.origin.top + topOffset,
        left: containerFrame.origin.left + leftOffset,
    });
}

const cellContentArea = ({
    width,
    height,
    rows,
    cols,
    aspectRatio,
}: {
    width: number;
    height: number;
    rows: number;
    cols: number;
    aspectRatio: number;
}) => {
    const bounds = fitToBounds(aspectRatio, { width: width / cols, height: height / rows });
    return Math.round(bounds.width * bounds.height);
};

const getWeightedSplitCount = ({
    vertical,
    width,
    height,
    count,
    aspectRatio,
}: {
    vertical: boolean;
    width: number;
    height: number;
    count: number;
    aspectRatio: number;
}) => {
    // Calculate cell content areas for 1, 2 and 3 (columns|rows) layouts
    // and pick the largest one:
    const choices = [1, 2, 3].map((rowCols) =>
        cellContentArea({
            width,
            height,
            rows: vertical ? Math.ceil(count / rowCols) : rowCols,
            cols: vertical ? rowCols : Math.ceil(count / rowCols),
            aspectRatio,
        })
    );
    const closest = Math.max(...choices);
    const splits = choices.indexOf(closest) + 1;

    return { splits, weight: closest };
};

const getGridSplits = ({
    width,
    height,
    count,
    aspectRatio,
}: {
    width: number;
    height: number;
    count: number;
    aspectRatio: number;
}) => {
    // Try both vertical and horizontal layout and pick the one that yields the
    // biggest video cells:
    const verticalPick = getWeightedSplitCount({ vertical: true, width, height, count, aspectRatio });
    const horizontalPick = getWeightedSplitCount({ vertical: false, width, height, count, aspectRatio });

    if (verticalPick.weight > horizontalPick.weight) {
        return { splits: verticalPick.splits, vertical: true };
    }
    return { splits: horizontalPick.splits, vertical: false };
};

export function getGridSizeForCount({
    count,
    width,
    height,
    aspectRatio,
}: {
    count: number;
    width: number;
    height: number;
    aspectRatio: number;
}) {
    if (count <= 1) {
        return {
            rows: 1,
            cols: 1,
        };
    }

    const { splits, vertical } = getGridSplits({ width, height, count, aspectRatio });

    if (vertical) {
        return {
            rows: Math.ceil(count / splits),
            cols: splits,
        };
    }

    return {
        rows: splits,
        cols: Math.ceil(count / splits),
    };
}
