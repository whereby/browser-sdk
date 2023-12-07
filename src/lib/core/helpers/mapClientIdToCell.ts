import { Frame, makeFrame, makeOrigin, Origin, StageLayout, VideoCell } from "./layout";

function pluckClientCell({ cells, clientId }: { cells: VideoCell[]; clientId: string }) {
    return cells.find((cell) => cell.clientId === clientId);
}

function screenSpaceCell({
    cell,
    stageLayout,
    roomFrame,
    videoStageFrame,
}: {
    cell: VideoCell;
    stageLayout: StageLayout;
    roomFrame: Frame;
    videoStageFrame: Frame;
}) {
    let containerOrigin = makeOrigin();

    if (cell.isVideoGridCell) {
        containerOrigin = {
            top: stageLayout.videoGrid.origin.top + stageLayout.videoGrid.paddings.top,
            left: stageLayout.videoGrid.origin.left + stageLayout.videoGrid.paddings.left,
        };
    } else if (cell.isPresentationGridCell) {
        containerOrigin = {
            top: stageLayout.presentationGrid.origin.top + stageLayout.presentationGrid.paddings.top,
            left: stageLayout.presentationGrid.origin.left + stageLayout.presentationGrid.paddings.left,
        };
    } else if (cell.isSubgridCell) {
        containerOrigin = stageLayout.subgrid.origin;
    }

    return {
        ...cell,
        origin: {
            top: roomFrame.origin.top + videoStageFrame.origin.top + containerOrigin.top + cell.origin.top,
            left: roomFrame.origin.left + videoStageFrame.origin.left + containerOrigin.left + cell.origin.left,
        },
    };
}

// Given a clientId and the output of a stageLayout run, find the cell and convert it to screen space coordinates
export default function mapClientIdToCell({
    clientId,
    stageLayout,
    roomFrame = makeFrame(),
    videoStageFrame = makeFrame(),
}: {
    clientId: string;
    stageLayout: StageLayout;
    roomFrame?: Frame;
    videoStageFrame?: Frame;
}) {
    if (stageLayout.floatingContent?.clientId === clientId) {
        // Floating cell is already in screen space
        return {
            ...stageLayout.floatingContent,
            isFloatingCell: true,
        };
    }
    if (stageLayout.presentationGrid.cells.length) {
        const cell = pluckClientCell({ cells: stageLayout.presentationGrid.cells, clientId });
        if (cell) {
            return screenSpaceCell({
                cell: {
                    ...cell,
                    isPresentationGridCell: true,
                },
                stageLayout,
                roomFrame,
                videoStageFrame,
            });
        }
    }
    if (stageLayout.videoGrid.cells.length) {
        const cell = pluckClientCell({ cells: stageLayout.videoGrid.cells, clientId });
        if (cell) {
            return screenSpaceCell({
                cell: {
                    ...cell,
                    isVideoGridCell: true,
                },
                stageLayout,
                roomFrame,
                videoStageFrame,
            });
        }
    }
    if (stageLayout.subgrid.cells.length) {
        const cell = pluckClientCell({ cells: stageLayout.subgrid.cells, clientId });
        if (cell) {
            return screenSpaceCell({
                cell: {
                    ...cell,
                    isSubgridCell: true,
                },
                stageLayout,
                roomFrame,
                videoStageFrame,
            });
        }
    }
}
