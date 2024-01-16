import * as React from "react";
import { LocalParticipant, RemoteParticipant, VideoView } from "..";
import { calculateLayout } from "./helpers/stageLayout";
import { makeBounds, makeFrame } from "./helpers/layout";
import { makeVideoCellView } from "./helpers/cellView";
import debounce from "../../../lib/utils/debounce";
import { RoomConnectionRef } from "../useRoomConnection/types";

function GridVideoCellView({
    cell,
    participant,
    render,
    onSetAspectRatio,
}: {
    cell: { clientId: string; bounds: { width: number; height: number }; origin: { top: number; left: number } };
    participant: RemoteParticipant | LocalParticipant;
    render?: () => React.ReactNode;
    onSetAspectRatio: ({ aspectRatio }: { aspectRatio: number }) => void;
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
            {render ? (
                render()
            ) : participant.stream ? (
                <VideoView style={{}} stream={participant.stream} onSetAspectRatio={onSetAspectRatio} />
            ) : null}
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
        participant: RemoteParticipant | LocalParticipant;
    }) => React.ReactNode;
    videoGridGap?: number;
}

function Grid({ roomConnection, renderParticipant, videoGridGap = 0 }: GridProps) {
    const { remoteParticipants, localParticipant } = roomConnection.state;
    const gridRef = React.useRef<HTMLDivElement>(null);
    const [videos, setVideos] = React.useState<ReturnType<typeof makeVideoCellView>[]>([]);
    const [stageLayout, setStageLayout] = React.useState<ReturnType<typeof calculateLayout> | null>(null);
    const [aspectRatios, setAspectRatios] = React.useState<{ clientId: string; aspectRatio: number }[]>([]);

    React.useEffect(() => {
        setVideos(
            [localParticipant, ...remoteParticipants].map((participant) =>
                makeVideoCellView({
                    aspectRatio: 16 / 9,
                    avatarSize: 0,
                    cellPaddings: 10,
                    client: participant,
                })
            )
        );
    }, [remoteParticipants, localParticipant]);

    React.useEffect(() => {
        setVideos((prev) => {
            return prev.map((video) => {
                const aspectRatio = aspectRatios.find((item) => item.clientId === video.clientId)?.aspectRatio;

                if (aspectRatio) {
                    return { ...video, aspectRatio };
                }

                return video;
            });
        });
    }, [aspectRatios]);

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
                            videoGridGap,
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
            {[localParticipant, ...remoteParticipants].map((participant, i) => {
                const cell = stageLayout?.videoGrid.cells[i];

                if (!cell || !participant || !participant.stream || !cell.clientId) return null;

                return (
                    <GridVideoCellView
                        key={cell.clientId}
                        cell={cell}
                        participant={participant}
                        render={renderParticipant ? () => renderParticipant({ cell, participant }) : undefined}
                        onSetAspectRatio={({ aspectRatio }) => {
                            setAspectRatios((prev) => {
                                const index = prev.findIndex((item) => item.clientId === cell.clientId);

                                if (index === -1) {
                                    return [...prev, { clientId: cell.clientId, aspectRatio }];
                                }

                                return [
                                    ...prev.slice(0, index),
                                    { clientId: cell.clientId, aspectRatio },
                                    ...prev.slice(index + 1),
                                ];
                            });
                        }}
                    />
                );
            })}
        </div>
    );
}

export { Grid };
