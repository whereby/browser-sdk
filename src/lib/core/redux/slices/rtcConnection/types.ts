import { StreamState } from "../../../../../lib/RoomParticipant";

export interface StreamStatusUpdate {
    clientId: string;
    streamId: string;
    state: StreamState;
}
