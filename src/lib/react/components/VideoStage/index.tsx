import { useCallback, useMemo, useState } from "react";
import { connect as connectSelectors } from "redux-bundler-react";

import styles from "./styles.css";
/* import RoomIntegrations from "./RoomIntegrations"; */
/* import GestureDetection from "./GestureDetection"; */

/* import EmptyRoomInvitation from "../EmptyRoomInvitation"; */
/* import EmptyRoomSignupCta from "../EmptyRoomSignupCta"; */
import GroupsPreview from "../../components/VideoStageLayout/GroupsPreview";
/* import RunningIntegration from "../RunningIntegration"; */
import RunningIntegrationSubgridCell from "../RunningIntegration/RunningIntegrationSubgridCell";
import VideoStageLayout from "../../components/VideoStageLayout";
import WebRtcVideo from "../WebRtcVideo";
import { VideoCell } from "../helpers/layout";
/* import ReactionsOverlay from "../ReactionsOverlay"; */
/* import { CustomisableVideoControls } from "../VideoControls"; */

interface RenderCellViewProps {
    cellView: VideoCell;
    props: React.PropsWithChildren;
}
function renderCellView({ cellView, props = {} }: RenderCellViewProps) {
    switch (cellView.type) {
        case "video":
            return (
                <WebRtcVideo
                    aspectRatio={cellView.aspectRatio}
                    client={cellView.client}
                    isDraggable={cellView.isDraggable}
                    isPlaceholder={cellView.isPlaceholder}
                    isSubgrid={cellView.isSubgrid}
                    key={cellView.client.id}
                    {...props}
                />
            );
        case "integration":
            return cellView.isSubgrid ? (
                <RunningIntegrationSubgridCell
                    aspectRatio={cellView.aspectRatio}
                    client={{ id: cellView.clientId }}
                    isDraggable={cellView.isDraggable}
                    integration={cellView.integration}
                    key={cellView.clientId}
                    {...props}
                />
            ) : (
                <RunningIntegration
                    aspectRatio={cellView.aspectRatio}
                    client={{ id: cellView.clientId }}
                    isDraggable={cellView.isDraggable}
                    integration={cellView.integration}
                    key={cellView.clientId}
                    {...props}
                />
            );
        case "copy_link":
            return (
                <EmptyRoomInvitation
                    aspectRatio={cellView.aspectRatio}
                    client={{ id: cellView.clientId }}
                    isDraggable={cellView.isDraggable}
                    key={cellView.clientId}
                    roomName={cellView.roomName}
                    {...props}
                />
            );
        case "signup_cta":
            return (
                <EmptyRoomSignupCta
                    aspectRatio={cellView.aspectRatio}
                    client={{ id: cellView.clientId }}
                    isDraggable={cellView.isDraggable}
                    key={cellView.clientId}
                    roomName={cellView.roomName}
                    {...props}
                />
            );
        case "groups":
            return (
                <GroupsPreview
                    aspectRatio={cellView.aspectRatio}
                    client={{ id: cellView.clientId }}
                    groupedClients={cellView.groupedClients}
                    key={cellView.clientId}
                    {...props}
                />
            );
        default:
            throw new Error("Unhandled cellView type", cellView.type);
    }
}

export function VideoStage({
    breakoutActive,
    breakoutCurrentGroup,
    canSpotlight,
    cellViewsFloating,
    cellViewsHiddenGrid,
    cellViewsHiddenPresentationGrid,
    cellViewsPipPresentationGrid,
    cellViewsPresentationGrid,
    cellViewsSubgrid,
    cellViewsVideoGrid,
    containerPaddings,
    doBreakoutJoin,
    doRemoveClientSpotlight,
    doReorderClients,
    doSetClientAspectRatio,
    doSetMaximizedClient,
    doSpotlightClient,
    doSwapSpotlightOrder,
    documentPipFrame,
    featureBrandAvatarsOn,
    featureJsGridMobileLayoutOff,
    featureRoundedCornersOff,
    frame,
    isFullscreenMode,
    isLocalClientSpotlighted,
    isMaximizeMode,
    isPhoneResolution,
    isPip = false,
    isTopToolbarHidden,
    layoutBreakoutStagePaddings,
    layoutOverflowBackdropFrame,
    layoutVideoStage,
    localClient,
    pipLayoutVideoStage,
    prefs,
    windowFrame,
}) {
    const groupsProps = useMemo(
        () =>
            layoutVideoStage.groups
                ? {
                      avatarSize: layoutVideoStage.groups.avatarSize,
                      cellLayout: layoutVideoStage.groups.cellLayout,
                      isConstrained: layoutVideoStage.groups.isConstrained,
                      style: { ...layoutVideoStage.groups.bounds },
                      doBreakoutJoin,
                      localClient,
                      isPip,
                  }
                : {},
        [layoutVideoStage.groups, doBreakoutJoin, localClient, isPip]
    );
    const [isPipToolbarPinned, setIsPipToolbarPinned] = useState(false);

    // Inject props not already part of cellView:
    const buildProps = useCallback(
        (cellView) => {
            if (cellView.type === "video") {
                return { doSetClientAspectRatio, isPip };
            } else if (cellView.type === "groups") {
                // Because groups is currently a big cell that lays out itself out, we have to inject the layout:
                return groupsProps;
            }
            return {};
        },
        [doSetClientAspectRatio, groupsProps, isPip]
    );

    const floatingContent = useMemo(
        () =>
            cellViewsFloating.map((cellView) =>
                renderCellView({ cellView, featureBrandAvatarsOn, props: buildProps(cellView) })
            )[0] || null,
        [cellViewsFloating, buildProps, featureBrandAvatarsOn]
    );

    const presentationGridContent = useMemo(
        () =>
            cellViewsPresentationGrid.map((cellView) =>
                renderCellView({ cellView, featureBrandAvatarsOn, props: buildProps(cellView) })
            ),
        [cellViewsPresentationGrid, buildProps, featureBrandAvatarsOn]
    );

    const pipPresentationGridContent = useMemo(
        () =>
            cellViewsPipPresentationGrid.map((cellView) =>
                renderCellView({ cellView, featureBrandAvatarsOn, props: buildProps(cellView) })
            ),
        [cellViewsPipPresentationGrid, buildProps, featureBrandAvatarsOn]
    );

    const hiddenPresentationGridContent = useMemo(
        () =>
            cellViewsHiddenPresentationGrid.map((cellView) =>
                renderCellView({ cellView, featureBrandAvatarsOn, props: buildProps(cellView) })
            ),
        [cellViewsHiddenPresentationGrid, buildProps, featureBrandAvatarsOn]
    );

    const subgridContent = useMemo(
        () =>
            cellViewsSubgrid.map((cellView) =>
                renderCellView({ cellView, featureBrandAvatarsOn, props: buildProps(cellView) })
            ),
        [cellViewsSubgrid, buildProps, featureBrandAvatarsOn]
    );

    const gridContent = useMemo(
        () =>
            cellViewsVideoGrid.map((cellView) =>
                renderCellView({ cellView, featureBrandAvatarsOn, props: buildProps(cellView) })
            ),
        [cellViewsVideoGrid, buildProps, featureBrandAvatarsOn]
    );

    const hiddenGridContent = useMemo(
        () =>
            cellViewsHiddenGrid.map((cellView) =>
                renderCellView({ cellView, featureBrandAvatarsOn, props: buildProps(cellView) })
            ),
        [cellViewsHiddenGrid, buildProps, featureBrandAvatarsOn]
    );

    if (isPip) {
        return (
            <div className={styles.pipRoomLayout}>
                <ReactionsOverlay layoutVideoStage={pipLayoutVideoStage} layoutVideoStageFrame={documentPipFrame} />
                <VideoStageLayout
                    breakoutStagePaddings={layoutBreakoutStagePaddings}
                    canSpotlight={canSpotlight}
                    containerPaddings={containerPaddings}
                    doRemoveClientSpotlight={doRemoveClientSpotlight}
                    doReorderClients={doReorderClients}
                    doSetClientAspectRatio={doSetClientAspectRatio}
                    doSetMaximizedClient={doSetMaximizedClient}
                    doSpotlightClient={doSpotlightClient}
                    doSwapSpotlightOrder={doSwapSpotlightOrder}
                    featureRoundedCornersOff={featureRoundedCornersOff}
                    floatingContent={null}
                    frame={documentPipFrame}
                    gridContent={gridContent}
                    hiddenGridContent={hiddenGridContent}
                    hiddenPresentationGridContent={hiddenPresentationGridContent}
                    isBreakoutNoGroup={breakoutActive && !breakoutCurrentGroup}
                    isConstrained={!featureJsGridMobileLayoutOff && isPhoneResolution}
                    isFullscreenMode={isFullscreenMode}
                    isLocalClientSpotlighted={isLocalClientSpotlighted}
                    isMaximizeMode={isMaximizeMode}
                    isTopToolbarHidden={isTopToolbarHidden}
                    layoutOverflowBackdropFrame={layoutOverflowBackdropFrame}
                    layoutVideoStage={pipLayoutVideoStage}
                    presentationGridContent={pipPresentationGridContent}
                    rebalanceLayout
                    reduceEffects={!prefs.effects}
                    subgridContent={subgridContent}
                    windowFrame={windowFrame}
                />
                <CustomisableVideoControls
                    bottomToolbarButtonItems={["cam", "mic", "pip-leave"]}
                    canPinBottomToolbar
                    isBottomToolbarPinned={isPipToolbarPinned}
                    isFloating
                    isInPip
                    isPopoverDisabled
                    onPinBottomToolbar={setIsPipToolbarPinned}
                    onSettingsClick={() => {}}
                    onToggleChatOpen={() => {}}
                />
            </div>
        );
    }

    return (
        <div className={styles.VideoStage}>
            <RoomIntegrations />
            <GestureDetection />
            <ReactionsOverlay layoutVideoStage={layoutVideoStage} layoutVideoStageFrame={frame} />
            <VideoStageLayout
                breakoutStagePaddings={layoutBreakoutStagePaddings}
                canSpotlight={canSpotlight}
                containerPaddings={containerPaddings}
                doRemoveClientSpotlight={doRemoveClientSpotlight}
                doReorderClients={doReorderClients}
                doSetClientAspectRatio={doSetClientAspectRatio}
                doSetMaximizedClient={doSetMaximizedClient}
                doSpotlightClient={doSpotlightClient}
                doSwapSpotlightOrder={doSwapSpotlightOrder}
                featureRoundedCornersOff={featureRoundedCornersOff}
                floatingContent={floatingContent}
                frame={frame}
                gridContent={gridContent}
                hiddenGridContent={hiddenGridContent}
                hiddenPresentationGridContent={hiddenPresentationGridContent}
                isBreakoutNoGroup={breakoutActive && !breakoutCurrentGroup}
                isConstrained={!featureJsGridMobileLayoutOff && isPhoneResolution}
                isFullscreenMode={isFullscreenMode}
                isLocalClientSpotlighted={isLocalClientSpotlighted}
                isMaximizeMode={isMaximizeMode}
                isTopToolbarHidden={isTopToolbarHidden}
                layoutOverflowBackdropFrame={layoutOverflowBackdropFrame}
                layoutVideoStage={layoutVideoStage}
                presentationGridContent={presentationGridContent}
                rebalanceLayout
                reduceEffects={!prefs.effects}
                subgridContent={subgridContent}
                windowFrame={windowFrame}
            />
        </div>
    );
}

VideoStage.propTypes = {
    breakoutActive: PropTypes.bool.isRequired,
    breakoutCurrentGroup: PropTypes.object,
    canSpotlight: PropTypes.bool.isRequired,
    cellViewsFloating: PropTypes.array.isRequired,
    cellViewsHiddenGrid: PropTypes.array.isRequired,
    cellViewsHiddenPresentationGrid: PropTypes.array.isRequired,
    cellViewsPipPresentationGrid: PropTypes.array.isRequired,
    cellViewsPresentationGrid: PropTypes.array.isRequired,
    cellViewsSubgrid: PropTypes.array.isRequired,
    cellViewsVideoGrid: PropTypes.array.isRequired,
    containerPaddings: boxPropType.isRequired,
    doBreakoutJoin: PropTypes.func.isRequired,
    doRemoveClientSpotlight: PropTypes.func.isRequired,
    doReorderClients: PropTypes.func.isRequired,
    doSetClientAspectRatio: PropTypes.func.isRequired,
    doSetMaximizedClient: PropTypes.func.isRequired,
    doSpotlightClient: PropTypes.func.isRequired,
    doSwapSpotlightOrder: PropTypes.func.isRequired,
    documentPipFrame: framePropType,
    featureBrandAvatarsOn: PropTypes.bool,
    featureJsGridMobileLayoutOff: PropTypes.bool.isRequired,
    featureRoundedCornersOff: PropTypes.bool.isRequired,
    frame: framePropType.isRequired,
    isFullscreenMode: PropTypes.bool.isRequired,
    isLocalClientSpotlighted: PropTypes.bool.isRequired,
    isMaximizeMode: PropTypes.bool.isRequired,
    isPhoneResolution: PropTypes.bool.isRequired,
    isPip: PropTypes.bool,
    isTopToolbarHidden: PropTypes.bool.isRequired,
    layoutBreakoutStagePaddings: boxPropType.isRequired,
    layoutOverflowBackdropFrame: framePropType.isRequired,
    layoutVideoStage: PropTypes.object.isRequired,
    localClient: clientPropType.isRequired,
    pipLayoutVideoStage: PropTypes.object,
    prefs: PropTypes.object.isRequired,
    windowFrame: framePropType.isRequired,
};

export default connectSelectors(
    "doBreakoutJoin",
    "doRemoveClientSpotlight",
    "doReorderClients",
    "doSetClientAspectRatio",
    "doSetMaximizedClient",
    "doSpotlightClient",
    "doSwapSpotlightOrder",
    "selectBreakoutActive",
    "selectBreakoutCurrentGroup",
    "selectDocumentPipFrame",
    "selectCanSpotlight",
    "selectCellViewsFloating",
    "selectCellViewsHiddenGrid",
    "selectCellViewsHiddenPresentationGrid",
    "selectCellViewsPipPresentationGrid",
    "selectCellViewsPresentationGrid",
    "selectCellViewsSubgrid",
    "selectCellViewsVideoGrid",
    "selectFeatureBrandAvatarsOn",
    "selectFeatureJsGridMobileLayoutOff",
    "selectFeatureRoundedCornersOff",
    "selectIsFullscreenMode",
    "selectIsLocalClientSpotlighted",
    "selectIsMaximizeMode",
    "selectIsPhoneResolution",
    "selectIsTopToolbarHidden",
    "selectLayoutBreakoutStagePaddings",
    "selectLayoutOverflowBackdropFrame",
    "selectLayoutVideoStage",
    "selectLocalClient",
    "selectPipLayoutVideoStage",
    "selectPrefs",
    VideoStage
);
