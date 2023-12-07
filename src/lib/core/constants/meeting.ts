export const TOWNHALL_PRESENTER_CLIENT_LIMIT = 12;

// We want to avoid triggering on the same breakpoint in both directions
// to avoid drastic changes when one or two clients refresh or leave
const LARGE_MEETING_NUM_CLIENTS_TRIGGER = TOWNHALL_PRESENTER_CLIENT_LIMIT;
const LARGE_MEETING_NUM_CLIENTS_DETRIGGER = Math.round(LARGE_MEETING_NUM_CLIENTS_TRIGGER / 1.5);
const XL_MEETING_NUM_CLIENTS_TRIGGER = 30;
const XL_MEETING_NUM_CLIENTS_DETRIGGER = Math.round(XL_MEETING_NUM_CLIENTS_TRIGGER / 1.5);
export const MEETING_SIZE_TRIGGERS = {
    small: { trigger: Infinity, detrigger: -Infinity },
    large: { trigger: LARGE_MEETING_NUM_CLIENTS_TRIGGER, detrigger: LARGE_MEETING_NUM_CLIENTS_DETRIGGER },
    xl: { trigger: XL_MEETING_NUM_CLIENTS_TRIGGER, detrigger: XL_MEETING_NUM_CLIENTS_DETRIGGER },
};
// used with ?skipLargeMode=on
export const MEETING_SIZE_SKIP_LARGE_TRIGGERS = {
    small: { trigger: Infinity, detrigger: -Infinity },
    xl: { trigger: LARGE_MEETING_NUM_CLIENTS_TRIGGER, detrigger: LARGE_MEETING_NUM_CLIENTS_DETRIGGER },
};
export type MeetingSize = keyof typeof MEETING_SIZE_TRIGGERS;
