import * as React from "react";
import { RemoteParticipant, VideoView } from "..";
import { calculateLayout } from "./helpers/stageLayout";
import { makeBounds, makeFrame } from "./helpers/layout";
import { makeVideoCellView } from "./helpers/cellView";
import debounce from "../../../lib/utils/debounce";
import { RoomConnectionRef } from "../useRoomConnection/types";

function GridVideoCellView({
    cell,
    participant,
    render,
}: {
    cell: { clientId: string; bounds: { width: number; height: number }; origin: { top: number; left: number } };
    participant: RemoteParticipant;
    render?: () => React.ReactNode;
}) {
    return (
        <div
            style={{
                position: "absolute",
                width: cell.bounds.width,
                height: cell.bounds.height,
                boxSizing: "border-box",
                top: cell.origin.top,
                left: cell.origin.left,
            }}
        >
            {render ? render() : participant.stream ? <VideoView style={{}} stream={participant.stream} /> : null}
        </div>
    );
}

interface GridProps {
    roomConnection: RoomConnectionRef;
    renderParticipant?: ({
        cell,
        participant,
    }: {
        cell: { clientId: string; bounds: { width: number; height: number }; origin: { top: number; left: number } };
        participant: RemoteParticipant;
    }) => React.ReactNode;
}

function Grid({ roomConnection, renderParticipant }: GridProps) {
    const { remoteParticipants } = roomConnection.state;
    const gridRef = React.useRef<HTMLDivElement>(null);
    const [videos, setVideos] = React.useState<ReturnType<typeof makeVideoCellView>[]>([]);
    const [stageLayout, setStageLayout] = React.useState<ReturnType<typeof calculateLayout> | null>(null);

    React.useEffect(() => {
        setVideos(
            remoteParticipants.map((participant) =>
                makeVideoCellView({
                    aspectRatio: 16 / 9,
                    avatarSize: 0,
                    cellPaddings: 10,
                    client: participant,
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
                            gridGap: 0,
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
                position: "relative",
            }}
        >
            {remoteParticipants.map((participant, i) => {
                const cell = stageLayout?.videoGrid.cells[i];

                if (!cell) return null;

                return (
                    <GridVideoCellView
                        key={cell.clientId}
                        cell={cell}
                        participant={participant}
                        render={renderParticipant ? () => renderParticipant({ cell, participant }) : undefined}
                    />
                );
            })}
        </div>
    );
}

export { Grid };
