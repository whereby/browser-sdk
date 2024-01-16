import { waitingParticipantsSlice } from "../waitingParticipants";
import { signalEvents } from "../signalConnection/actions";

describe("reducer", () => {
    describe('on signal "room_joined"', () => {
        it("should update waitingParticipants array based on knockers in the room", () => {
            const clientId = "client-id";
            const displayName = "Client";

            const state = waitingParticipantsSlice.reducer(
                undefined,
                signalEvents.roomJoined({
                    isLocked: true,
                    selfId: "self-id",
                    room: {
                        clients: [],
                        knockers: [
                            {
                                clientId,
                                displayName,
                                imageUrl: null,
                                liveVideo: false,
                                userAvatarUrl: null,
                                userId: null,
                            },
                        ],
                        session: null,
                    },
                })
            );

            expect(state).toEqual({ waitingParticipants: [{ id: clientId, displayName }] });
        });
    });
});
