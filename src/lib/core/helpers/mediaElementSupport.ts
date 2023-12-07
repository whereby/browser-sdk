export function canSwitchSpeaker() {
    return (
        global.HTMLMediaElement &&
        "setSinkId" in global.HTMLMediaElement.prototype &&
        !/[Ff]irefox/.test(global.navigator.userAgent)
    );
}
