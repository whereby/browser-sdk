import { selectLocalMediaShouldStartWithOptions, selectLocalMediaShouldStop } from "../localMedia";

describe("localMediaSlice", () => {
    describe("reactors", () => {
        describe("reactLocalMediaStart", () => {
            it.each`
                appWantsToJoin | localMediaStatus | localMediaOptions               | expected
                ${false}       | ${""}            | ${undefined}                    | ${undefined}
                ${false}       | ${"started"}     | ${undefined}                    | ${undefined}
                ${false}       | ${"started"}     | ${{ audio: true, video: true }} | ${undefined}
                ${true}        | ${"started"}     | ${{ audio: true, video: true }} | ${undefined}
                ${true}        | ${""}            | ${undefined}                    | ${undefined}
                ${true}        | ${""}            | ${{ audio: true, video: true }} | ${{ audio: true, video: true }}
            `(
                "expected $expected when appWantsToJoin=$appWantsToJoin, localMediaStatus=$localMediaStatus, localMediaOptions=$localMediaOptions",
                ({ appWantsToJoin, localMediaStatus, localMediaOptions, expected }) => {
                    expect(
                        selectLocalMediaShouldStartWithOptions.resultFunc(
                            appWantsToJoin,
                            localMediaStatus,
                            localMediaOptions
                        )
                    ).toEqual(expected);
                }
            );
        });

        describe("reactLocalMediaStop", () => {
            it.each`
                appWantsToJoin | localMediaStatus | localMediaOptions               | expected
                ${true}        | ${"started"}     | ${undefined}                    | ${false}
                ${true}        | ${"started"}     | ${{ audio: true, video: true }} | ${false}
                ${false}       | ${""}            | ${{ audio: true, video: true }} | ${false}
                ${false}       | ${"started"}     | ${undefined}                    | ${false}
                ${false}       | ${"started"}     | ${{ audio: true, video: true }} | ${true}
            `(
                "expected $expected when appWantsToJoin=$appWantsToJoin, localMediaStatus=$localMediaStatus, localMediaOptions=$localMediaOptions",
                ({ appWantsToJoin, localMediaStatus, localMediaOptions, expected }) => {
                    expect(
                        selectLocalMediaShouldStop.resultFunc(appWantsToJoin, localMediaStatus, localMediaOptions)
                    ).toEqual(expected);
                }
            );
        });
    });
});
