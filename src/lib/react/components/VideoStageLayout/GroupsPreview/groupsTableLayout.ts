import { makeBox, makeBounds } from "../../helpers/layout";
import { default as LAYOUT_CONSTANTS } from "../../constants/layout";
const { GROUPS_ROW_HEIGHT, GROUPS_ROW_GAP } = LAYOUT_CONSTANTS;
import { Box } from "../../helpers/layout";

export function calculateLayout({
    cellCount,
    height,
    paddings = makeBox(),
    width,
}: {
    cellCount: number;
    height: number;
    paddings?: Box;
    width: number;
}) {
    const availableHeight = height - (paddings.top + paddings.bottom);
    const tableHeight = GROUPS_ROW_HEIGHT * cellCount + (GROUPS_ROW_GAP * cellCount - 1);
    const extraVerticalPadding = Math.max((height - tableHeight) / 2, 0);
    return {
        bounds: makeBounds({
            width, // we take up full width
            height: Math.min(availableHeight, tableHeight) + (paddings.top + paddings.bottom), // but only height we need
        }),
        rows: cellCount,
        extraHorizontalPadding: 0,
        extraVerticalPadding,
        paddings,
        // Not ideal, but always true - because we switch on this to render the table..
        isConstrained: true,
    };
}
