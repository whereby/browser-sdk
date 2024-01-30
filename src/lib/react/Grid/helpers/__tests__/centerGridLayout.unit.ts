import * as grid from "../centerGridLayout";

const sanityLayout = {
    cellWidth: 600,
    cellHeight: 450,
    rows: 1,
    cols: 1,
    gridGap: 0,
    extraHorizontalPadding: 0,
    extraVerticalPadding: 25,
    cellCount: 1,
    paddings: { top: 0, left: 0, bottom: 0, right: 0 },
};

const sanityLayout2 = {
    cellWidth: 400,
    cellHeight: 300,
    rows: 2,
    cols: 1,
    gridGap: 0,
    extraHorizontalPadding: 50,
    extraVerticalPadding: 0,
    cellCount: 2,
    paddings: { top: 0, left: 0, bottom: 0, right: 0 },
};

const NORMAL_AR = 4 / 3;

describe("calculateLayout", () => {
    it.each`
        cellCount | width  | height | gridGap | cellAspectRatios | expectedResult
        ${1}      | ${600} | ${500} | ${0}    | ${[NORMAL_AR]}   | ${sanityLayout}
        ${2}      | ${500} | ${600} | ${0}    | ${[NORMAL_AR]}   | ${sanityLayout2}
    `(
        "returns $expectedResult layout for $cellCount cell(s) in a (w: $width, h: $height) container",
        ({ cellCount, width, height, gridGap, cellAspectRatios, expectedResult }) => {
            expect(
                grid.calculateLayout({
                    cellCount,
                    width,
                    height,
                    gridGap,
                    cellAspectRatios,
                })
            ).toEqual(expectedResult);
        }
    );
});
