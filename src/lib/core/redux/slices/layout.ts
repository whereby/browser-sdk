import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import LAYOUT_CONSTANTS from "../../constants/layout";
const {
    BOTTOM_TOOLBAR_HEIGHT,
    BREAKOUT_STAGE_BACKDROP_FOOTER_HEIGHT,
    BREAKOUT_STAGE_BACKDROP_HEADER_HEIGHT,
    FLOATING_VIDEO_CONTROLS_BOTTOM_MARGIN,
    FOLDABLE_SCREEN_STAGE_PADDING,
    MIN_WINDOW_HEIGHT,
    MIN_WINDOW_WIDTH,
    SIDEBAR_WIDTH,
    TOP_TOOLBAR_HEIGHT,
    VIDEO_CONTROLS_MIN_WIDTH,
    WATERMARK_BAR_HEIGHT,
} = LAYOUT_CONSTANTS;
import { MEETING_SIZE_TRIGGERS, MEETING_SIZE_SKIP_LARGE_TRIGGERS, MeetingSize } from "../../constants/meeting";
import { calculateLayout, SUBGRID_CELL_PADDING_BOX } from "~/lib/react/components/VideoStageLayout/stageLayout";
import { makeFrame, makeBox, calculateResponsiveLayout, hasBounds } from "~/lib/react/components/helpers/layout";
import { findNextMeetingSize } from "../../helpers/meetingSize";
import mapClientIdToCell from "../../helpers/mapClientIdToCell";
import { RootState } from "../store";

const initialState = {
    aspectRatios: {},
    hasOverflow: false,
    meetingSize: Object.keys(MEETING_SIZE_TRIGGERS)[0] as MeetingSize,
};

export const layoutSlice = createSlice({
    name: "layout",
    initialState,
    reducers: {
        doSetClientAspectRatio: (state, action: PayloadAction<{ id: string; aspectRatio: number }>) => {
            state.aspectRatios = { ...state.aspectRatios, ...{ [action.payload.id]: action.payload.aspectRatio } };
        },
        doSetLayoutHasOverflow: (state, action: PayloadAction<{ hasOverflow: boolean }>) => {
            state.hasOverflow = action.payload.hasOverflow;
        },
        doSetLayoutMeetingSize: (state, action: PayloadAction<{ size: MeetingSize }>) => {
            state.meetingSize = action.payload.size;
        },
    },
});

const thing =  {
    name: "layout",
    getMiddleware: () => (store) => (next) => (action) => {
        const prevCanFitToolbars = store.selectLayoutCanFitToolbars();
        const { hasOverflow: prevHasOverflow } = store.selectLayoutRaw();
        const prevClientCount = store.selectAllClientViews().length;

        next(action);

        // Auto toggle toolbars when resizing window between constrained layout and not
        const canFitToolbars = store.selectLayoutCanFitToolbars();
        const isConstrained = !canFitToolbars;
        const areToolbarsHidden = store.selectIsTopToolbarHidden() || store.selectIsBottomToolbarHidden();
        if (canFitToolbars !== prevCanFitToolbars) {
            if (isConstrained !== areToolbarsHidden) {
                store.doToggleToolbars();
            }
        }

        // Sync layout overflow state with the rest of the layout
        const { hasOverflow } = store.selectLayoutVideoStage();
        if (!prevHasOverflow && hasOverflow) {
            store.doSetLayoutHasOverflow(true);
        } else if (prevHasOverflow && !hasOverflow) {
            store.doSetLayoutHasOverflow(false);
        }

        // Trigger layout meeting size based on breakpoints
        const clientCount = store.selectAllClientViews().length;
        const meetingSize = store.selectLayoutMeetingSize();
        if (prevClientCount !== clientCount) {
            const prefs = store.selectPrefs();
            const nextMeetingSize = findNextMeetingSize({
                triggers: prefs.skipLargeMode ? MEETING_SIZE_SKIP_LARGE_TRIGGERS : MEETING_SIZE_TRIGGERS,
                clientCount,
                meetingSize,
            });
            if (nextMeetingSize !== meetingSize) {
                store.doSetLayoutMeetingSize(nextMeetingSize);
            }
        }
    },
};

export const selectLayoutRaw = (state: RootState) => state.layout
export const selectLayoutClientAspectRatios = (state: RootState) => state.layout.aspectRatios
export const selectLayoutMeetingSize = (state: RootState) => state.layout.meetingSize
export const selectLayoutIsSmallMeetingSize = (state: RootState) => state.layout.meetingSize === "small"
export const selectLayoutIsLargeMeetingSize = (state: RootState) => state.layout.meetingSize === "large"
export const selectLayoutIsXLMeetingSize = (state: RootState) => state.layout.meetingSize === "xl"
export const selectLayoutWindowFrame = createSelector(selectDocumentSize, ([width, height]: [number, number]) => makeFrame({ width, height }))
// On most scenarios this will match window frame unless the watermark
// is visible or the device exposes safe area insets
export const selectLayoutRoomFrame = createSelector(
    "selectLayoutWindowFrame",
    "selectSafeAreaInsets",
    "selectShouldShowWatermark",
    (windowFrame, safeAreaInsets, shouldShowWatermark) =>
        makeFrame({
            width: windowFrame.bounds.width - safeAreaInsets.left - safeAreaInsets.right,
            height: shouldShowWatermark
                ? windowFrame.bounds.height - WATERMARK_BAR_HEIGHT
                : windowFrame.bounds.height,
            top: shouldShowWatermark ? safeAreaInsets.top + WATERMARK_BAR_HEIGHT : safeAreaInsets.top,
            left: safeAreaInsets.left,
        })
)    // Reserve extra space to clear the floating toolbar
export const selectLayoutRoomBottomMargin = createSelector(
    "selectIsBottomToolbarFloating",
    "selectIsBottomToolbarPinned",
    "selectLayoutGridGap",
    "selectLayoutHasOverflow",
    (isBottomToolbarFloating, isBottomToolbarPinned, gridGap, layoutHasOverflow) =>
        (isBottomToolbarFloating && isBottomToolbarPinned) || layoutHasOverflow ? BOTTOM_TOOLBAR_HEIGHT : 0
)
export const selectLayoutHasOverflow = createSelector(
    "selectLayoutRaw",
    "selectBreakoutCurrentGroup",
    // For now ignore overflow flag if in a breakout group
    (raw, breakoutCurrentGroup) => !breakoutCurrentGroup && raw.hasOverflow
)
export const selectLayoutResponsive = createSelector("selectLayoutRoomFrame", (roomFrame) => calculateResponsiveLayout(roomFrame.bounds))
export const selectLayoutIsExportConstrained = createSelector("selectLayoutResponsive", (responsive) => responsive.isPhone)
export const selectLayoutIsPortrait = createSelector("selectLayoutResponsive", (responsive) => responsive.isPortrait)
export const selectLayoutCanFitToolbars = createSelector(
    "selectLayoutRoomFrame",
    (roomFrame) => roomFrame.bounds.width >= MIN_WINDOW_WIDTH && roomFrame.bounds.height >= MIN_WINDOW_HEIGHT
)
export const selectLayoutIsSidebarFloating = createSelector(
    "selectLayoutIsExport Constrained",
    "selectLayoutRoomFrame",
    (isExport Constrained, roomFrame) =>
        isExport Constrained || roomFrame.bounds.width - SIDEBAR_WIDTH <= VIDEO_CONTROLS_MIN_WIDTH
)
export const selectLayoutStageFrame = createSelector(
    "selectIsSidebarOpen",
    "selectLayoutIsExport Constrained",
    "selectLayoutIsSidebarFloating",
    "selectLayoutRoomFrame",
    (isSidebarOpen, isExport Constrained, isSidebarFloating, roomFrame) =>
        makeFrame({
            width:
            isSidebarOpen && !isSidebarFloating && !isExport Constrained
                ? roomFrame.bounds.width - SIDEBAR_WIDTH
                : roomFrame.bounds.width,
            height: roomFrame.bounds.height,
        })
)
export const selectLayoutVideoStageFrame = createSelector(
    "selectHasBottomToolbar",
    "selectHasTopToolbar",
    "selectIsBottomToolbarFloating",
    "selectIsTopToolbarFloating",
    "selectLayoutBottomToolbarBounds",
    "selectLayoutStageFrame",
    "selectLayoutTopToolbarBounds",
    "selectDevicePosture",
    (
        hasBottomToolbar,
        hasTopToolbar,
        isBottomToolbarFloating,
        isTopToolbarFloating,
        bottomToolbarBounds,
        stageFrame,
        topToolbarBounds,
        devicePosture
    ) => {
        const isScreenFolded = devicePosture === "folded";
        const isLandscape = stageFrame.bounds.width > stageFrame.bounds.height;
        const topToolbarLayoutHeight = !hasTopToolbar || isTopToolbarFloating ? 0 : topToolbarBounds.height;
        const bottomToolbarLayoutHeight =
            !hasBottomToolbar || isBottomToolbarFloating || isScreenFolded ? 0 : bottomToolbarBounds.height;

        const height = isScreenFolded && !isLandscape ? stageFrame.bounds.height / 2 : stageFrame.bounds.height;
        return makeFrame({
            width: stageFrame.bounds.width,
            height: height - topToolbarLayoutHeight - bottomToolbarLayoutHeight,
            top: topToolbarLayoutHeight,
            left: 0,
        });
    }
)
export const selectLayoutVideoStagePaddings = createSelector(
    "selectBreakoutActive",
    "selectBreakoutCurrentGroup",
    "selectCanSpotlight",
    "selectCellViewsPresentationGrid",
    "selectHasBottomToolbar",
    "selectHasTopToolbar",
    "selectIsBottomToolbarFloating",
    "selectIsTopToolbarFloating",
    "selectLayoutGridGap",
    "selectLayoutHasOverflow",
    "selectLayoutIsConstrained",
    "selectDevicePosture",
    (
        breakoutActive,
        breakoutCurrentGroup,
        canSpotlight,
        cellViewsPresentationGrid,
        hasBottomToolbar,
        hasTopToolbar,
        isBottomToolbarFloating,
        isTopToolbarFloating,
        gridGap,
        layoutHasOverflow,
        isConstrained,
        devicePosture
    ) => {
        const areBothToolbarsFloating = isTopToolbarFloating && isBottomToolbarFloating;
        const base = isConstrained ? 4 : 8;
        const top = isTopToolbarFloating || !hasTopToolbar ? base : 0;
        const isScreenFolded = devicePosture === "folded";
        let bottom = isBottomToolbarFloating ? FLOATING_VIDEO_CONTROLS_BOTTOM_MARGIN : 0;
        // If layout isn't overflowing and the toolbars are both hidden (viewport too small or user initiated)
        // we match the top and bottom margin so it looks balanced:
        if (!hasBottomToolbar || (areBothToolbarsFloating && !layoutHasOverflow)) {
            bottom = base;
        }
        if (isScreenFolded) {
            bottom = bottom + FOLDABLE_SCREEN_STAGE_PADDING;
        }
        const paddings = makeBox({ top, left: base, bottom, right: base });

        // We inset the whole grid for to make way for breakout stage footer if stage is empty and we can spotlight
        if (breakoutActive && !breakoutCurrentGroup && !cellViewsPresentationGrid.length && canSpotlight) {
            paddings.top += BREAKOUT_STAGE_BACKDROP_FOOTER_HEIGHT + gridGap;
        }
        return paddings;
    }
)
export const selectLayoutVideoStageIsConstrained = createSelector(
    "selectFeatureJsGridMobileLayoutOff",
    "selectIsPhoneResolution",
    (featureJsGridMobileLayoutOff, isPhoneResolution) => !featureJsGridMobileLayoutOff && isPhoneResolution
)
export const selectLayoutGridGap = createSelector("selectLayoutVideoStageIsConstrained", (isConstrained) =>
    isConstrained ? 4 : 8
                                                )
export const selectLayoutVideoGridGap = createSelector(
    "selectLayoutVideoStageIsConstrained",
    "selectPrefs",
    (isConstrained, prefs) => (!prefs.videoGridGap ? 0 : isConstrained ? 4 : 8)
)
export const selectLayoutBreakoutStagePaddings = createSelector(
    "selectBreakoutActive",
    "selectBreakoutCurrentGroup",
    "selectCanSpotlight",
    "selectCellViewsPresentationGrid",
    "selectIsFullscreenMode",
    "selectIsLocalClientSpotlighted",
    "selectIsMaximizeMode",
    "selectLayoutGridGap",
    (
        breakoutActive,
        breakoutCurrentGroup,
        canSpotlight,
        cellViewsPresentationGrid,
        isFullscreenMode,
        isLocalClientSpotlighted,
        isMaximizeMode,
        gridGap
    ) => {
        const hasBreakoutStage =
            breakoutActive &&
            !breakoutCurrentGroup &&
            !isMaximizeMode &&
            !isFullscreenMode &&
            (cellViewsPresentationGrid.length > 0 || canSpotlight);
        return hasBreakoutStage
            ? makeBox({
                top: BREAKOUT_STAGE_BACKDROP_HEADER_HEIGHT,
                bottom:
                canSpotlight || isLocalClientSpotlighted ? BREAKOUT_STAGE_BACKDROP_FOOTER_HEIGHT : gridGap,
            })
            : makeBox();
    }
)
export const selectLayoutVideoStage = createSelector(
    "selectBreakoutActive",
    "selectBreakoutGroupedClients",
    "selectCanSpotlight",
    "selectCellViewsFloating",
    "selectCellViewsPresentationGrid",
    "selectCellViewsSubgrid",
    "selectCellViewsVideoGrid",
    "selectIsBottomToolbarFloating",
    "selectIsBottomToolbarPinned",
    "selectIsMaximizeMode",
    "selectLayoutBreakoutStagePaddings",
    "selectLayoutGridGap",
    "selectLayoutHasOverflow",
    "selectLayoutIsXLMeetingSize",
    "selectLayoutVideoGridGap",
    "selectLayoutVideoStageFrame",
    "selectLayoutVideoStageIsConstrained",
    "selectLayoutVideoStagePaddings",
    "selectLayoutWindowFrame",
    "selectPrefs",
    (
        breakoutActive,
        breakoutGroupedClients,
        canSpotlight,
        cellViewsFloating,
        cellViewsPresentationGrid,
        cellViewsSubgrid,
        cellViewsVideoGrid,
        isBottomToolbarFloating,
        isBottomToolbarPinned,
        isMaximizeMode,
        breakoutStagePaddings,
        gridGap,
        layoutHasOverflow,
        isXLMeetingSize,
        videoGridGap,
        videoStageFrame,
        videoStageIsConstrained,
        videoStagePaddings,
        windowFrame,
        prefs
    ) =>
        calculateLayout({
            breakoutActive,
            breakoutGroupedClients,
            breakoutStagePaddings,
            subgridCellPaddings: prefs.subgridLabels
                ? SUBGRID_CELL_PADDING_BOX
                : makeBox({ top: 4, right: 4, bottom: 4, left: 4 }), // legacy paddings
            floatingVideo: cellViewsFloating[0] || null,
            frame: videoStageFrame,
            gridGap,
            isConstrained: videoStageIsConstrained,
            isMaximizeMode,
            isXLMeetingSize,
            paddings: videoStagePaddings,
            presentationVideos: cellViewsPresentationGrid,
            rebalanceLayout: true,
            roomBounds: windowFrame.bounds,
            roomLayoutHasOverlow: layoutHasOverflow,
            subgridVideos: cellViewsSubgrid,
            videos: cellViewsVideoGrid,
            videoGridGap,
            videoControlsHeight:
            (isBottomToolbarFloating && isBottomToolbarPinned) || !isBottomToolbarFloating
                ? BOTTOM_TOOLBAR_HEIGHT
                : 0,
        })
)
export const selectPipLayoutVideoStage = createSelector(
    "selectBreakoutActive",
    "selectBreakoutGroupedClients",
    "selectCanSpotlight",
    "selectCellViewsFloating",
    "selectCellViewsSubgrid",
    "selectCellViewsVideoGrid",
    "selectDocumentPipFrame",
    "selectIsBottomToolbarFloating",
    "selectIsBottomToolbarPinned",
    "selectIsMaximizeMode",
    "selectLayoutBreakoutStagePaddings",
    "selectLayoutGridGap",
    "selectLayoutHasOverflow",
    "selectLayoutIsXLMeetingSize",
    "selectLayoutVideoGridGap",
    "selectLayoutVideoStageIsConstrained",
    "selectLayoutVideoStagePaddings",
    "selectLayoutWindowFrame",
    "selectCellViewsPipPresentationGrid",
    (
        breakoutActive,
        breakoutGroupedClients,
        canSpotlight,
        cellViewsFloating,
        cellViewsSubgrid,
        cellViewsVideoGrid,
        documentPipFrame,
        isBottomToolbarFloating,
        isBottomToolbarPinned,
        isMaximizeMode,
        breakoutStagePaddings,
        gridGap,
        layoutHasOverflow,
        isXLMeetingSize,
        videoGridGap,
        videoStageIsConstrained,
        videoStagePaddings,
        windowFrame,
        cellViewsPipPresentationGrid
    ) =>
        documentPipFrame
        ? calculateLayout({
            breakoutActive,
            breakoutGroupedClients,
            breakoutStagePaddings,
            subgridCellPaddings: SUBGRID_CELL_PADDING_BOX,
            floatingVideo: null,
            frame: documentPipFrame,
            gridGap,
            isConstrained: videoStageIsConstrained,
            isMaximizeMode,
            isXLMeetingSize,
            paddings: videoStagePaddings,
            presentationVideos: cellViewsPipPresentationGrid,
            rebalanceLayout: true,
            roomBounds: windowFrame.bounds,
            roomLayoutHasOverlow: layoutHasOverflow,
            subgridVideos: cellViewsSubgrid,
            videos: cellViewsVideoGrid,
            videoGridGap,
            videoControlsHeight: BOTTOM_TOOLBAR_HEIGHT,
        })
        : null
)
export const selectLayoutVideoStageOverflowHeight = createSelector(
    "selectLayoutVideoStage",
    "selectLayoutVideoStageFrame",
    (layoutVideoStage, videoStageFrame) =>
        (layoutVideoStage.hasOverflow && layoutVideoStage.bounds.height - videoStageFrame.bounds.height) || 0
)
export const selectLayoutOverflowBackdropFrame = createSelector(
    "selectLayoutRoomBottomMargin",
    "selectLayoutVideoStage",
    "selectLayoutVideoStagePaddings",
    (roomBottomMargin, layoutVideoStage, videoStagePaddings) =>
        // We only render the overflow backdrop if we're overflowing and have a stage:
        layoutVideoStage.hasOverflow &&
        (hasBounds(layoutVideoStage.presentationGrid.bounds) || hasBounds(layoutVideoStage.videoGrid.bounds))
        ? makeFrame({
            top: layoutVideoStage.subgrid.origin.top,
            width: layoutVideoStage.bounds.width,
            height: layoutVideoStage.subgrid.bounds.height + roomBottomMargin + videoStagePaddings.bottom,
        })
        : makeFrame()
)
export const selectLayoutTopToolbarBounds = createSelector("selectLayoutStageFrame", (stageFrame) => ({
    width: stageFrame.bounds.width,
    height: TOP_TOOLBAR_HEIGHT,
}))
export const selectLayoutBottomToolbarBounds = createSelector(
    "selectIsBottomToolbarFloating",
    "selectLayoutStageFrame",
    "selectSafeAreaInsets",
    "selectDevicePosture",
    (isBottomToolbarFloating, stageFrame, safeAreaInsets, devicePosture) => {
        const isScreenFolded = devicePosture === "folded";
        const height = isScreenFolded ? BOTTOM_TOOLBAR_HEIGHT * 2 : BOTTOM_TOOLBAR_HEIGHT;
        return {
            width: stageFrame.bounds.width,
            // Absorb bottom safe area margin if toolbar isn't floating (floating bars already do this as they're fixed positioned)
            height: height + (isBottomToolbarFloating ? 0 : safeAreaInsets.bottom),
        };
    }
)
export const selectLayoutRemoteCellBounds = createSelector(
    "selectLayoutVideoStage",
    "selectRemoteClientViews",
    (stageLayout, remoteClientViews) => {
        const newUpdatedSizes = {};
        remoteClientViews.forEach((client) => {
            const streamId = client.stream?.id;
            const cell = streamId && mapClientIdToCell({ clientId: client.id, stageLayout });
            if (!cell) {
                return;
            }
            newUpdatedSizes[streamId] = cell.bounds;
        });
        return newUpdatedSizes;
    }
)
