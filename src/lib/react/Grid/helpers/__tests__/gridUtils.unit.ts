import { getGridSizeForCount, fitToBounds } from "../gridUtils";

describe("getGridSizeForCount", () => {
    it.each`
        count | width   | height  | expectedResult
        ${1}  | ${500}  | ${500}  | ${{ rows: 1, cols: 1 }}
        ${2}  | ${500}  | ${500}  | ${{ rows: 2, cols: 1 }}
        ${2}  | ${1000} | ${500}  | ${{ rows: 1, cols: 2 }}
        ${3}  | ${500}  | ${500}  | ${{ rows: 2, cols: 2 }}
        ${3}  | ${1000} | ${500}  | ${{ rows: 1, cols: 3 }}
        ${6}  | ${500}  | ${1600} | ${{ rows: 6, cols: 1 }}
        ${6}  | ${1600} | ${500}  | ${{ rows: 2, cols: 3 }}
        ${12} | ${500}  | ${1000} | ${{ rows: 6, cols: 2 }}
        ${12} | ${1600} | ${500}  | ${{ rows: 2, cols: 6 }}
        ${12} | ${500}  | ${500}  | ${{ rows: 4, cols: 3 }}
    `(
        "returns $expectedResult grid size for container bounds $width $height",
        ({ count, width, height, expectedResult }) => {
            expect(getGridSizeForCount({ count, width, height, aspectRatio: 4 / 3 })).toEqual(expectedResult);
        }
    );
});

describe("fitToBounds", () => {
    it.each`
        aspectRatio | width  | height | expectedResult
        ${0.5}      | ${100} | ${100} | ${{ width: 50, height: 100 }}
        ${1}        | ${100} | ${100} | ${{ width: 100, height: 100 }}
        ${2}        | ${100} | ${100} | ${{ width: 100, height: 50 }}
    `(
        "returns $expectedResult grid size for container bounds $width $height",
        ({ aspectRatio, width, height, expectedResult }) => {
            expect(fitToBounds(aspectRatio, { width, height })).toEqual(expectedResult);
        }
    );
});
