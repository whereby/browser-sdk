// Given the current meeting size and client count, test the meeting size triggers

import { MeetingSize, MEETING_SIZE_TRIGGERS } from "../constants/meeting";

// and return the next state (or same if it hasn't changed)
MEETING_SIZE_TRIGGERS;
export function findNextMeetingSize({
    triggers,
    meetingSize,
    clientCount,
}: {
    triggers: typeof MEETING_SIZE_TRIGGERS;
    meetingSize: keyof typeof MEETING_SIZE_TRIGGERS;
    clientCount: number;
}) {
    const limitKeys = Object.keys(triggers) as unknown as MeetingSize[]; // assumes sorted
    const meetingSizeIndex = limitKeys.indexOf(meetingSize);
    // Check if we need to move meetingSize up
    for (let i = limitKeys.length - 1; i >= meetingSizeIndex; i--) {
        if (clientCount >= triggers[limitKeys[i] as MeetingSize].trigger) {
            return limitKeys[i];
        }
    }
    // Check if we need to move meetingSize down
    for (let i = 0; i <= meetingSizeIndex; i++) {
        if (clientCount <= triggers[limitKeys[i] as MeetingSize].detrigger) {
            return limitKeys[i - 1];
        }
    }
    // Nothing changed
    return meetingSize;
}
