import { StreamState } from "../../../../../lib/core/RoomParticipant";

export interface StreamStatusUpdate {
    clientId: string;
    streamId: string;
    state: StreamState;
}
