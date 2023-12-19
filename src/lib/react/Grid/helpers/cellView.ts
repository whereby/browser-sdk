export function makeVideoCellView({
    aspectRatio,
    avatarSize,
    cellPaddings,
    client = undefined,
    isDraggable = true,
    isPlaceholder = false,
    isSubgrid = false,
}: {
    aspectRatio?: number;
    avatarSize?: number;
    cellPaddings?: number;
    client?: { id: string };
    isDraggable?: boolean;
    isPlaceholder?: boolean;
    isSubgrid?: boolean;
}) {
    return {
        aspectRatio: aspectRatio || 16 / 9,
        avatarSize,
        cellPaddings,
        client,
        clientId: client?.id || "",
        isDraggable,
        isPlaceholder,
        isSubgrid,
        type: "video",
    };
}
