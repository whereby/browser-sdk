export function getAudioTrackPropertiesFromHTMLVideoElement(e: HTMLVideoElement) {
    if (!e.srcObject) return null;
    const mediaStream = e.srcObject as MediaStream;
    const audioTrack = mediaStream?.getAudioTracks()?.[0];
    return {
        readyState: audioTrack?.readyState,
        kind: audioTrack?.kind,
        muted: audioTrack?.muted,
        enabled: audioTrack?.enabled,
    };
}
