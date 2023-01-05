interface RoomParticipantData {
    displayName: string;
    id: string;
    stream?: MediaStream;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
}

export default class RoomParticipant {
    public readonly displayName;
    public readonly id;
    public readonly stream?: MediaStream;
    public readonly isAudioEnabled: boolean;
    public readonly isLocalParticipant: boolean = false;
    public readonly isVideoEnabled: boolean;

    constructor({ displayName, id, stream, isAudioEnabled, isVideoEnabled }: RoomParticipantData) {
        this.displayName = displayName;
        this.id = id;
        this.stream = stream;
        this.isAudioEnabled = isAudioEnabled;
        this.isVideoEnabled = isVideoEnabled;
    }
}

interface RemoteParticipantData {
    newJoiner: boolean;
    streams: string[];
}

export type StreamState =
    | "new_accept"
    | "to_accept"
    | "old_accept"
    | "done_accept"
    | "to_unaccept"
    | "done_unaccept"
    | "auto";

interface Stream {
    id: string;
    state: StreamState;
}

export class RemoteParticipant extends RoomParticipant {
    public readonly newJoiner: boolean;
    public readonly streams: Stream[];

    constructor({
        displayName,
        id,
        newJoiner,
        streams,
        isAudioEnabled,
        isVideoEnabled,
    }: RoomParticipantData & RemoteParticipantData) {
        super({ displayName, id, isAudioEnabled, isVideoEnabled });
        this.newJoiner = newJoiner;

        this.streams = streams.map((streamId) => ({ id: streamId, state: newJoiner ? "new_accept" : "to_accept" }));
    }

    updateStreamState(streamId: string, state: StreamState) {
        const stream = this.streams.find((s) => s.id === streamId);
        if (stream) {
            stream.state = state;
        }
    }
}

export class LocalParticipant extends RoomParticipant {
    public readonly isLocalParticipant = true;

    constructor({ displayName, id, stream, isAudioEnabled, isVideoEnabled }: RoomParticipantData) {
        super({ displayName, id, stream, isAudioEnabled, isVideoEnabled });
    }
}
