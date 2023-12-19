import * as React from "react";
import { RemoteParticipant } from "..";
import { calculateLayout } from "./helpers/stageLayout";
import { makeBounds, makeFrame } from "./helpers/layout";
import { makeVideoCellView } from "./helpers/cellView";
import debounce from "../../../lib/utils/debounce";

interface GridProps {
    remoteParticipants: RemoteParticipant[];
}

function Grid({ remoteParticipants }: GridProps) {
    const gridRef = React.useRef<HTMLDivElement>(null);
    const [videos, setVideos] = React.useState<ReturnType<typeof makeVideoCellView>[]>([]);
    const [stageLayout, setStageLayout] = React.useState<ReturnType<typeof calculateLayout> | null>(null);

    React.useEffect(() => {
        setVideos(
            remoteParticipants.map((participant) =>
                makeVideoCellView({
                    aspectRatio: 1,
                    avatarSize: 0,
                    cellPaddings: 10,
                    client: participant,
                    isDraggable: false,
                    isPlaceholder: false,
                    isSubgrid: false,
                })
            )
        );
    }, [remoteParticipants]);

    React.useEffect(() => {
        if (!gridRef.current || !videos.length) {
            return;
        }

        const resizeObserver = new ResizeObserver(
            debounce(
                () => {
                    setStageLayout(() => {
                        return calculateLayout({
                            frame: makeFrame({
                                width: gridRef.current?.clientWidth,
                                height: gridRef.current?.clientHeight,
                            }),
                            gridGap: 10,
                            isConstrained: false,
                            roomBounds: makeBounds({
                                width: gridRef.current?.clientWidth,
                                height: gridRef.current?.clientHeight,
                            }),
                            videos,
                        });
                    });
                },
                { delay: 60 }
            )
        );
        resizeObserver.observe(gridRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [videos]);

    return (
        <div
            ref={gridRef}
            style={{
                width: "100%",
                height: "100%",
                backgroundColor: "blue",
                position: "relative",
            }}
        >
            {videos.map((_, i) => {
                const cell = stageLayout?.videoGrid.cells[i];

                if (!stageLayout || !cell) return null;

                const origin = {
                    top: stageLayout.videoGrid.origin.top + stageLayout.videoGrid.paddings.top + cell.origin.top,
                    left: stageLayout.videoGrid.origin.left + stageLayout.videoGrid.paddings.left + cell.origin.left,
                };
                return (
                    <div
                        key={cell.clientId}
                        style={{
                            backgroundColor: "red",
                            width: cell.bounds.width,
                            height: cell.bounds.height,
                            border: "1px solid black",
                            boxSizing: "border-box",
                            position: "absolute",
                            top: origin.top,
                            left: origin.left,
                        }}
                    />
                );
            })}
        </div>
    );
}

export { Grid };
