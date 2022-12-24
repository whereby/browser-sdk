interface RoomParticipantData {
    displayName: string;
    id: string;
    stream?: MediaStream;
}

export default class RoomParticipant {
    public readonly displayName;
    public readonly id;
    public readonly stream?: MediaStream;
    public readonly isLocalParticipant: boolean = false;

    constructor({ displayName, id, stream }: RoomParticipantData) {
        this.displayName = displayName;
        this.id = id;
        this.stream = stream;
    }
}

interface RemoteParticipantData {
    newJoiner: boolean;
    streams: string[];
}

interface Stream {
    id: string;
    state: "new_accept" | "to_accept" | "done_accept" | "to_unaccept" | "done_unaccept" | "auto";
}

export class RemoteParticipant extends RoomParticipant {
    public readonly newJoiner: boolean;
    public readonly streams: Stream[];

    constructor({ displayName, id, newJoiner, streams }: RoomParticipantData & RemoteParticipantData) {
        super({ displayName, id });
        this.newJoiner = newJoiner;

        this.streams = streams.map((streamId) => ({ id: streamId, state: newJoiner ? "new_accept" : "to_accept" }));
    }
}

export class LocalParticipant extends RoomParticipant {
    public readonly isLocalParticipant = true;

    constructor({ displayName, id, stream }: RoomParticipantData) {
        super({ displayName, id, stream });
    }
}
