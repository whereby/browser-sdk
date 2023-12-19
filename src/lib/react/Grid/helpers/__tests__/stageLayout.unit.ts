import { calculateStageLayout } from "../stageLayout";

const GRID_GAP_PX = 10;

const wideScreenNoSubgrid = {
    hasOverflow: false,
    isPortrait: false,
    videosContainer: {
        bounds: {
            width: 600,
            height: 400,
        },
        origin: {
            top: 0,
            left: 0,
        },
    },
};

describe("calculateStageLayout", () => {
    it.each`
        width  | height | isConstrained | isPortrait | expectedResult
        ${600} | ${400} | ${true}       | ${false}   | ${wideScreenNoSubgrid}
    `(
        "returns expected stage layout in a (w: $width, h: $height) container isPortrait:$isPortrait",
        ({ width, height, isPortrait, expectedResult }) => {
            expect(
                calculateStageLayout({
                    containerBounds: { width, height },
                    containerOrigin: { top: 0, left: 0 },
                    isPortrait,
                    gridGap: GRID_GAP_PX,
                    hasConstrainedOverflow: false,
                    hasPresentationContent: true,
                    hasVideoContent: true,
                })
            ).toEqual(expectedResult);
        }
    );
});
