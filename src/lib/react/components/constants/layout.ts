// Source of truth layout related constants
// Shared with CSS via environment variables declared in css-env-variables.js
// CommonJS because it's loaded by postcss-env-function pre-transpilation

const VIDEO_CONTROLS_MIN_WIDTH = 7 * 60;
export {};

export default {
    // Minimum window size before we start floating the toolbars
    MIN_WINDOW_HEIGHT: 320,
    MIN_WINDOW_WIDTH: 320,
    // Breakpoints
    DESKTOP_BREAKPOINT: 1025,
    TABLET_BREAKPOINT: 750,
    PHONE_BREAKPOINT: 500,
    // Room layout
    TOP_TOOLBAR_HEIGHT: 40 + 8 * 2,
    BOTTOM_TOOLBAR_HEIGHT: 70 + 4 * 3,
    SIDEBAR_WIDTH: 375,
    VIDEO_CONTROLS_MIN_WIDTH,
    ROOM_FOOTER_MIN_WIDTH: 60 * 3 + VIDEO_CONTROLS_MIN_WIDTH,
    FLOATING_VIDEO_CONTROLS_BOTTOM_MARGIN: 20,
    WATERMARK_BAR_HEIGHT: 32,
    // Breakout stage (no active group)
    BREAKOUT_STAGE_BACKDROP_HEADER_HEIGHT: 20 + 8,
    BREAKOUT_STAGE_BACKDROP_FOOTER_HEIGHT: 8 + 40 + 8,
    // Subgrid
    SUBGRID_EMPTY_STAGE_MAX_WIDTH: 800,
    // Groups grid
    GROUPS_CELL_MARGIN: 8,
    GROUPS_CELL_PADDING: 12,
    GROUPS_CELL_NAV_HEIGHT: 48 + 8,
    GROUPS_CELL_AVATAR_WRAPPER_BOTTOM_MARGIN: 8,
    GROUPS_CELL_AVATAR_GRID_GAP: 8,
    GROUPS_CELL_MIN_WIDTH: 360,
    GROUPS_CELL_MAX_WIDTH: 600,
    // Groups table
    GROUPS_ROW_HEIGHT: 72,
    GROUPS_ROW_GAP: 1,
    // Foldable screen
    FOLDABLE_SCREEN_STAGE_PADDING: 8,
};
