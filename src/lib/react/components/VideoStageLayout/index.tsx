import { cloneElement, JSXElementConstructor, ReactElement } from "react";
import cn from "classnames";
import adapter from "webrtc-adapter";

import styles from "./styles.css";

import { calculateDndIndicatorsLayout } from "./dndLayout";
import BreakoutStage, { BreakoutStageBroadcastAnnouncementType, BreakoutStagePrimaryButtonType } from "./BreakoutStage";

import useDrag, { UseDragResult } from "./useDrag";
import DragOverlay from "./DragOverlay";

import VideoCell from "../VideoCell";

import {
    hasBounds,
    makeBox,
    makeFrame,
    Bounds,
    Box,
    Frame,
    Origin,
    StageLayout,
    VideoCell as VideoCellType,
} from "../helpers/layout";
import { default as LAYOUT_CONSTANTS } from "../constants/layout";
const { TOP_TOOLBAR_HEIGHT, BREAKOUT_STAGE_BACKDROP_HEADER_HEIGHT, BREAKOUT_STAGE_BACKDROP_FOOTER_HEIGHT } =
    LAYOUT_CONSTANTS;

type GridContent = ReactElement<any, string | JSXElementConstructor<any>>;

const noop = () => undefined;
type NoOp = () => void;

function generateStylesFromFrame({ origin, bounds }: { origin: Origin; bounds: Bounds }) {
    return {
        top: Math.round(origin.top),
        left: Math.round(origin.left),
        height: Math.round(bounds.height),
        width: Math.round(bounds.width),
    };
}
function renderVideoCell({
    bind,
    cell,
    child,
    className = "",
    clientId,
    style = {},
    withRoundedCorners = false,
    withShadow = false,
}: {
    bind?: UseDragResult;
    cell: VideoCellType;
    child: GridContent;
    className?: string;
    clientId: string;
    style?: React.CSSProperties;
    withRoundedCorners?: boolean;
    withShadow?: boolean;
}) {
    const isHidden = !hasBounds(cell.bounds);
    return (
        <VideoCell
            width={cell.bounds.width}
            height={cell.bounds.height}
            aspectRatio={cell.aspectRatio}
            style={isHidden ? { width: 0, height: 0 } : style}
            withRoundedCorners={withRoundedCorners}
            withShadow={withShadow}
            key={clientId}
            className={cn(className, { [styles.hidden]: isHidden })}
            {...(bind ? bind({ clientId }) : {})}
        >
            {child}
        </VideoCell>
    );
}

function renderFloatingVideoCell({
    content,
    windowFrame,
    stageLayout,
    withRoundedCorners,
}: {
    content: GridContent;
    windowFrame: Frame;
    stageLayout: StageLayout & { floatingContent: VideoCellType };
    withRoundedCorners: boolean;
}) {
    const cell = stageLayout.floatingContent;
    const origin = { top: cell.origin.top, left: cell.origin.left };
    const style = {
        width: Math.round(cell.bounds.width),
        height: Math.round(cell.bounds.height),
        // Convert coordinates from video stage to room layout space (to account for any safe area margins!)
        transform: `translate3d(${Math.round(windowFrame.origin.left + origin.left)}px, ${Math.round(
            windowFrame.origin.top + origin.top
        )}px, 0)`,
    };
    const clientId = content.props.client.id;
    const childWithProps = cloneElement(content, {
        isSmallCell: cell.isSmallCell,
        isZoomedByDefault: false,
        canZoom: false,
        key: clientId,
        isDraggable: false, // override
    });

    return renderVideoCell({
        cell,
        child: childWithProps,
        className: styles.floatingVideoCell,
        clientId,
        style,
        withRoundedCorners,
        withShadow: false,
    });
}

function renderHiddenVideoCells({ content }: { content: GridContent[] }) {
    const frame = makeFrame();

    return content.map((child) => {
        const clientId = child.props.client.id;
        const childWithProps = cloneElement(child, {
            key: clientId,
            canZoom: false,
        });

        return renderVideoCell({
            cell: { aspectRatio: child.props.aspectRatio, clientId, ...frame },
            child: childWithProps,
            className: styles.gridVideoCell,
            clientId,
        });
    });
}

function renderPresentationGridVideoCells({
    bind,
    content,
    isConstrained,
    stageLayout,
    withRoundedCorners,
    withShadow,
}: {
    bind: UseDragResult;
    content: GridContent[];
    isConstrained: boolean;
    stageLayout: StageLayout;
    withRoundedCorners: boolean;
    withShadow: boolean;
}) {
    const cells = stageLayout.presentationGrid.cells;
    return content.map((child, index) => {
        const cell = cells[index];
        const origin = {
            top: stageLayout.presentationGrid.origin.top + stageLayout.presentationGrid.paddings.top + cell.origin.top,
            left:
                stageLayout.presentationGrid.origin.left +
                stageLayout.presentationGrid.paddings.left +
                cell.origin.left,
        };
        const style = {
            width: Math.round(cell.bounds.width),
            height: Math.round(cell.bounds.height),
            transform: `translate3d(${Math.round(origin.left)}px, ${Math.round(origin.top)}px, 0)`,
        };
        const clientId = child.props.client.id;
        const childWithProps = cloneElement(child, {
            isSmallCell: cell.isSmallCell,
            isZoomedByDefault: !!isConstrained && !child.props.client.isPresentation,
            canZoom: !!isConstrained,
            key: clientId,
        });

        return renderVideoCell({
            bind: child.props.isDraggable ? bind : undefined,
            cell,
            child: childWithProps,
            className: cn("jstest-supersized-content", styles.gridVideoCell),
            clientId,
            style,
            withRoundedCorners,
            withShadow,
        });
    });
}

function renderGridVideoCells({
    bind,
    content,
    isConstrained,
    stageLayout,
    withRoundedCorners,
    withShadow,
}: {
    bind: UseDragResult;
    content: GridContent[];
    isConstrained: boolean;
    stageLayout: StageLayout;
    withRoundedCorners: boolean;
    withShadow: boolean;
}) {
    const cells = stageLayout.videoGrid.cells;
    const gridVideoCells = content.map((child, index) => {
        const cell: VideoCellType = cells[index];
        const origin = {
            top: stageLayout.videoGrid.origin.top + stageLayout.videoGrid.paddings.top + cell.origin.top,
            left: stageLayout.videoGrid.origin.left + stageLayout.videoGrid.paddings.left + cell.origin.left,
        };
        const style = {
            width: Math.round(cell.bounds.width),
            height: Math.round(cell.bounds.height),
            transform: `translate3d(${Math.round(origin.left)}px, ${Math.round(origin.top)}px, 0)`,
        };

        const clientId = child.props.client.id;
        const childWithProps = cloneElement(child, {
            isSmallCell: cell.isSmallCell,
            isZoomedByDefault: !!isConstrained && !child.props.client.isPresentation,
            canZoom: !!isConstrained,
            key: clientId,
        });

        return renderVideoCell({
            bind,
            cell,
            child: childWithProps,
            className: styles.gridVideoCell,
            clientId,
            withRoundedCorners,
            style,
            withShadow,
        });
    });
    return gridVideoCells;
}

// This is a workaround for recent safari browsers freezing/crashing when selfview
// videos are moved to subgrid when subgridLabels are on (because of extra padding?!)
// When using safari, it will now get a different key when moving to/from subgrid, which
// will cause a new element to be created instead of beeing moved. This will cause
// a short blink on the selfview - but avoid safari hiccup
function getSubgridChildKey(client: { id: string; isSelfieCam: boolean }) {
    let key = client.id;
    if (client.isSelfieCam && adapter.browserDetails.browser === "safari") key += "_subgrid";
    return key;
}

function renderSubgridVideoCells({
    content,
    stageLayout,
    withRoundedCorners,
    withShadow,
}: {
    content: GridContent[];
    stageLayout: StageLayout;
    withRoundedCorners: boolean;
    withShadow: boolean;
    isConstrained: boolean;
    noneOnStage: boolean;
    stageBounds: Bounds;
}) {
    const cells = stageLayout.subgrid.cells;
    return content.map((child, index) => {
        const cell: VideoCellType = cells[index];
        const style: React.CSSProperties = {};
        style.height = Math.round(cell.bounds.height);
        style.width = Math.round(cell.bounds.width);
        const origin = {
            top: stageLayout.subgrid.origin.top + cell.origin.top,
            left: stageLayout.subgrid.origin.left + cell.origin.left,
        };
        style.transform = `translate3d(${Math.round(origin.left)}px, ${Math.round(origin.top)}px, 0)`;
        const clientId = child.props.client.id;
        const { left: leftPad = 0, right: rightPad = 0 } = cell.paddings || {};
        const childWithProps = cloneElement(child, {
            avatarSize: cell.bounds.width - leftPad - rightPad,
            canZoom: false,
            cellPaddings: cell.paddings,
            isSmallCell: cell.isSmallCell,
            isZoomedByDefault: false,
            key: getSubgridChildKey(child.props.client),
            style,
        });

        return renderVideoCell({
            cell,
            child: childWithProps,
            className: styles.gridVideoCell,
            clientId,
            style,
            withRoundedCorners,
            withShadow,
        });
    });
}

function extractIntegration(cells: JSX.Element[]) {
    const videoCells = [];
    let integrationCell = null;
    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        if (cell.key === "room-integration") {
            integrationCell = cell;
        } else {
            videoCells.push(cell);
        }
    }
    return { integrationCell, videoCells };
}

function VideoStageLayout({
    breakoutStagePaddings,
    canSpotlight = false,
    containerPaddings = makeBox(),
    debug = false,
    doRemoveClientSpotlight = noop,
    doReorderClients = noop,
    doSetMaximizedClient = noop,
    doSpotlightClient = noop,
    doSwapSpotlightOrder = noop,
    featureRoundedCornersOff = false,
    floatingContent,
    frame,
    gridContent = [],
    hiddenGridContent = [],
    hiddenPresentationGridContent = [],
    isBreakoutNoGroup = false,
    isConstrained = false,
    isFullscreenMode = false,
    isLocalClientSpotlighted = false,
    isMaximizeMode = false,
    isTopToolbarHidden = false,
    layoutOverflowBackdropFrame = makeFrame(),
    layoutVideoStage: stageLayout,
    presentationGridContent = [],
    reduceEffects = false,
    subgridContent = [],
    windowFrame,
    breakoutStagePrimaryButton,
    breakoutStageBroadcastAnnouncement,
}: {
    breakoutStagePaddings: Box;
    canSpotlight?: boolean;
    containerPaddings?: Box;
    debug?: boolean;
    doRemoveClientSpotlight?: NoOp;
    doReorderClients?: (args: { id: string; withId: string }) => void;
    doSetMaximizedClient?: (args: { id: string; source: string; type: string }) => void;
    doSpotlightClient?: NoOp;
    doSwapSpotlightOrder?: (args: { id: string; withId: string }) => void;
    featureRoundedCornersOff?: boolean;
    floatingContent?: GridContent;
    frame: Frame;
    gridContent?: GridContent[];
    hiddenGridContent?: GridContent[];
    hiddenPresentationGridContent?: GridContent[];
    isBreakoutNoGroup?: boolean;
    isConstrained?: boolean;
    isFullscreenMode?: boolean;
    isLocalClientSpotlighted?: boolean;
    isMaximizeMode?: boolean;
    isTopToolbarHidden?: boolean;
    layoutOverflowBackdropFrame?: Frame;
    layoutVideoStage: StageLayout;
    presentationGridContent?: GridContent[];
    reduceEffects?: boolean;
    subgridContent?: GridContent[];
    windowFrame: Frame;
    breakoutStagePrimaryButton: BreakoutStagePrimaryButtonType;
    breakoutStageBroadcastAnnouncement: BreakoutStageBroadcastAnnouncementType;
}) {
    const hasSupersizedContent = !!presentationGridContent.length;
    const hasVideoGridContent = !!gridContent.length;
    const noneOnStage = !hasSupersizedContent && !hasVideoGridContent;
    const withRoundedCorners = !featureRoundedCornersOff && !isConstrained && !reduceEffects;
    const breakoutStageIsEmpty = !presentationGridContent.length;
    const hasBreakoutStage =
        isBreakoutNoGroup && !isMaximizeMode && !isFullscreenMode && (!breakoutStageIsEmpty || canSpotlight);

    // DND:
    const bind = useDrag(({ isFirstEvent, isActive, xy, delta, args: { clientId }, cancelDrag }) => {
        // Ignore the pointer down event
        if (isFirstEvent) {
            return;
        }
        // Don't accept drag gestures if we're missing the identifier:
        if (!clientId) {
            cancelDrag();
            return;
        }

        const yOffset = window.scrollY || 0;
        const indicators = calculateDndIndicatorsLayout({
            stageOrigin: frame.origin,
            stageLayout,
            xy,
            delta,
            draggedClientId: clientId,
            isMaximizeMode,
            yOffset,
        });

        if (isActive) {
            // Update overlay
            DragOverlay.update({
                dragIndicatorFrame: indicators.dragIndicator?.frame,
                dropIndicatorFrame: indicators.dropIndicator?.frame,
            });
        } else {
            // Process drop if we have a valid target:
            if (indicators.dropIndicator) {
                const targetClientId = indicators.dropIndicator.cell.clientId;
                const draggedClientIsPresentation = !!stageLayout.presentationGrid.cells.find(
                    (cell) => cell.clientId === clientId
                );

                if (draggedClientIsPresentation && !isMaximizeMode) {
                    doSwapSpotlightOrder({ id: clientId, withId: targetClientId });
                } else if (draggedClientIsPresentation && isMaximizeMode && clientId === "room-integration") {
                    doSetMaximizedClient({ id: targetClientId, source: "reorder", type: "integration" });
                } else if (!draggedClientIsPresentation && isMaximizeMode && targetClientId === "room-integration") {
                    doSetMaximizedClient({ id: clientId, source: "reorder", type: "integration" });
                } else {
                    doReorderClients({ id: clientId, withId: targetClientId });
                }
            }
            // Reset overlay
            DragOverlay.update();
        }
    });

    // Build grid cells:
    const cells = [];

    // Grid:
    if (gridContent.length) {
        cells.push(
            ...renderGridVideoCells({
                bind,
                content: gridContent,
                isConstrained,
                stageLayout,
                withRoundedCorners: !isBreakoutNoGroup && withRoundedCorners,
                withShadow: !isBreakoutNoGroup && !isConstrained && !reduceEffects,
            })
        );
    }
    if (hiddenGridContent.length) {
        cells.push(...renderHiddenVideoCells({ content: hiddenGridContent }));
    }
    // Supersized:
    if (presentationGridContent.length) {
        cells.push(
            ...renderPresentationGridVideoCells({
                bind,
                content: presentationGridContent,
                isConstrained,
                stageLayout,
                withRoundedCorners,
                withShadow: !isConstrained && !reduceEffects,
            })
        );
    }
    if (hiddenPresentationGridContent.length) {
        cells.push(...renderHiddenVideoCells({ content: hiddenPresentationGridContent }));
    }
    // Floating:
    if (floatingContent && stageLayout.floatingContent) {
        cells.push(
            renderFloatingVideoCell({
                content: floatingContent,
                windowFrame,
                stageLayout: {
                    // some weird Typescript BS
                    ...stageLayout,
                    floatingContent: stageLayout.floatingContent,
                },
                withRoundedCorners: !featureRoundedCornersOff && !reduceEffects, // round even if constrained (if feature allows)
            })
        );
    }
    // Subgrid:
    if (subgridContent.length) {
        cells.push(
            ...renderSubgridVideoCells({
                content: subgridContent,
                isConstrained,
                noneOnStage,
                stageBounds: frame.bounds,
                stageLayout,
                withRoundedCorners: !featureRoundedCornersOff && !reduceEffects, // round even if constrained (if feature allows)
                withShadow: !reduceEffects,
            })
        );
    }
    // Pull out the integration - it must always be first DOM child otherwise the iframe might reload:
    const { integrationCell, videoCells } = extractIntegration(cells);

    // Lay out breakout stage (no active group)
    let breakoutStage = null;
    if (hasBreakoutStage) {
        const topToolbarHeight = isTopToolbarHidden ? 0 : TOP_TOOLBAR_HEIGHT;
        const stageContentHeight =
            stageLayout.presentationGrid.bounds.height - breakoutStagePaddings.top - breakoutStagePaddings.bottom;
        const backdropHeight =
            containerPaddings.top +
            topToolbarHeight +
            (canSpotlight && breakoutStageIsEmpty ? 0 : BREAKOUT_STAGE_BACKDROP_HEADER_HEIGHT) +
            Math.max(stageContentHeight, 0) +
            (canSpotlight || isLocalClientSpotlighted ? BREAKOUT_STAGE_BACKDROP_FOOTER_HEIGHT : stageLayout.gridGap);

        // We cover the presentation grid if we have spotlights, otherwise we inset the whole stage by the footer height:
        const breakoutStageOrigin = {
            top: breakoutStageIsEmpty ? 0 : stageLayout.presentationGrid.origin.top,
            left: 0,
        };
        const breakoutStageBounds = {
            height: breakoutStageIsEmpty
                ? BREAKOUT_STAGE_BACKDROP_FOOTER_HEIGHT
                : stageLayout.presentationGrid.bounds.height,
            width:
                (breakoutStageIsEmpty ? frame.bounds.width : stageLayout.presentationGrid.bounds.width) +
                2 * stageLayout.gridGap,
        };
        breakoutStage = (
            <BreakoutStage
                broadcastAnnouncement={breakoutStageBroadcastAnnouncement}
                primaryButton={breakoutStagePrimaryButton}
                backdropHeight={backdropHeight}
                backdropOffset={topToolbarHeight + containerPaddings.top}
                canSpotlight={canSpotlight}
                cellCount={presentationGridContent.length}
                isOnStage={isLocalClientSpotlighted}
                onGetOffStage={doRemoveClientSpotlight}
                onGetOnStage={doSpotlightClient}
                style={generateStylesFromFrame({
                    origin: breakoutStageOrigin,
                    bounds: breakoutStageBounds,
                })}
            />
        );
    }

    return (
        <div
            className={cn(styles.VideoStageLayout, { [styles.debug]: debug })}
            key={"video-stage-layout"}
            onDragStart={noop}
        >
            {hasBreakoutStage && breakoutStage}
            {hasBounds(layoutOverflowBackdropFrame.bounds) && (
                <div className={styles.overflowBackdrop} style={generateStylesFromFrame(layoutOverflowBackdropFrame)} />
            )}
            {integrationCell}
            {videoCells}
            {debug && (
                <>
                    <div className={styles.debugShape} style={generateStylesFromFrame(stageLayout.presentationGrid)} />
                    <div className={styles.debugShape} style={generateStylesFromFrame(stageLayout.videoGrid)} />
                    <div className={styles.debugShape} style={generateStylesFromFrame(stageLayout.subgrid)} />
                </>
            )}
            <DragOverlay key={"drag-overlay"} withRoundedCorners={withRoundedCorners} />
        </div>
    );
}

export default VideoStageLayout;
