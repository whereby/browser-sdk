import { extractDate, extractNullOrString, extractString } from "../extractUtils";
import { assertString, assertInstanceOf } from "../parameterAssertUtils";
import { Json } from "../Response";

export default class Meeting {
    meetingId: string;
    roomName: string;
    roomUrl: string;
    startDate: Date;
    endDate: Date;
    hostRoomUrl: string | null;
    viewerRoomUrl: string | null;

    constructor({ meetingId, roomName, roomUrl, startDate, endDate, hostRoomUrl, viewerRoomUrl }: Meeting) {
        assertString(meetingId, "meetingId");
        assertString(roomName, "roomName");
        assertString(roomUrl, "roomUrl");

        assertInstanceOf(startDate, Date, "startDate");
        assertInstanceOf(endDate, Date, "endDate");

        this.meetingId = meetingId;
        this.roomName = roomName;
        this.roomUrl = roomUrl;
        this.startDate = startDate;
        this.endDate = endDate;
        this.hostRoomUrl = hostRoomUrl;
        this.viewerRoomUrl = viewerRoomUrl;
    }

    static fromJson(data: Json): Meeting {
        return new Meeting({
            meetingId: extractString(data, "meetingId"),
            roomName: extractString(data, "roomName"),
            roomUrl: extractString(data, "roomUrl"),
            startDate: extractDate(data, "startDate"),
            endDate: extractDate(data, "endDate"),
            hostRoomUrl: extractNullOrString(data, "hostRoomUrl"),
            viewerRoomUrl: extractNullOrString(data, "viewerRoomUrl"),
        });
    }
}
