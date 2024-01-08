export function parseRoomUrlAndSubdomain(roomAttribute?: string, subdomainAttribute?: string) {
    if (!roomAttribute) {
        throw new Error("Missing room attribute");
    }

    // Get subdomain from room URL, or use it specified
    const m = /https:\/\/([^.]+)(\.whereby\.com|-ip-\d+-\d+-\d+-\d+.hereby.dev:4443)\/.+/.exec(roomAttribute);
    const subdomain = (m && m[1]) || subdomainAttribute;

    if (!subdomain) {
        throw new Error("Missing subdomain attribute");
    }
    if (!m) {
        throw new Error("Could not parse room URL");
    }

    const roomUrl = new URL(roomAttribute);

    return {
        subdomain,
        roomUrl,
    };
}
