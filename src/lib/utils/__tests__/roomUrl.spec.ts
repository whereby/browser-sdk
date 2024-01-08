import { parseRoomUrlAndSubdomain } from "../roomUrl";

describe("roomUrl", () => {
    describe("parseRoomUrlAndSubdomain", () => {
        it.each`
            roomAttribute                                                     | subdomainAttribute | expectedRes
            ${""}                                                             | ${undefined}       | ${new Error("Missing room attribute")}
            ${"https://abc.whereby.com/room"}                                 | ${undefined}       | ${{ roomUrl: new URL("https://abc.whereby.com/room"), subdomain: "abc" }}
            ${"https://abc.whereby.com/room?roomKey=123"}                     | ${undefined}       | ${{ roomUrl: new URL("https://abc.whereby.com/room?roomKey=123"), subdomain: "abc" }}
            ${"https://abc-ip-127-0-0-1.hereby.dev:4443/room?roomKey=123"}    | ${undefined}       | ${{ roomUrl: new URL("https://abc-ip-127-0-0-1.hereby.dev:4443/room?roomKey=123"), subdomain: "abc" }}
            ${"https://abc-ip-192-168-2-22.hereby.dev:4443/room?roomKey=123"} | ${undefined}       | ${{ roomUrl: new URL("https://abc-ip-192-168-2-22.hereby.dev:4443/room?roomKey=123"), subdomain: "abc" }}
            ${"https://whereby.com/room"}                                     | ${undefined}       | ${new Error("Missing subdomain attribute")}
            ${"https://abc.whereby.com"}                                      | ${"tt"}            | ${new Error("Could not parse room URL")}
        `(
            "should return $expectedRes when roomAttribute:$roomAttribute, subdomainAttribute:$subdomainAttribute",
            ({ roomAttribute, subdomainAttribute, expectedRes }) => {
                let res;

                try {
                    res = parseRoomUrlAndSubdomain(roomAttribute, subdomainAttribute);
                } catch (error) {
                    res = error;
                }

                expect(res).toEqual(expectedRes);
            }
        );
    });
});
