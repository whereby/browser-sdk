// Render media elements into a container that we move around as needed.
// See: https://github.com/facebook/react/issues/12247
// eslint-disable-next-line react/display-name
import ReactDOM from "react-dom";

import ScreenshareOverlay from "../ScreenshareOverlay";
import VideoElement from "../../../components/VideoElement";
import AudioElement from "../../../components/AudioElement";
import { Client } from "../../helpers/layout";

export function createPortalTarget() {
    const target = document.createElement("div");
    target.style.height = "100%";
    target.style.width = "100%";
    target.style.pointerEvents = "none";
    return target;
}

const MediaPortal = ({
    audioStream,
    client,
    handleVideoLoaded,
    handleVideoResized,
    target,
    isInCoLocationGroupWithLoudSpeaker,
    isWindowFocused,
    localScreenshareSource,
    useBlur,
    withRoundedCorners,
    audioElementRef,
    videoElementRef,
}: {
    audioStream: MediaStream;
    client: Client;
    handleVideoLoaded: () => void;
    handleVideoResized: () => void;
    target: Element;
    isInCoLocationGroupWithLoudSpeaker: boolean;
    isWindowFocused: boolean;
    localScreenshareSource: string;
    useBlur: boolean;
    withRoundedCorners: boolean;
    audioElementRef: React.RefObject<AudioElement>;
    videoElementRef: React.RefObject<VideoElement>;
}) => {
    if (!target) return null;
    return ReactDOM.createPortal(
        <>
            {client.isPresentation && client.isLocalClient && client.stream && localScreenshareSource === "screen" && (
                <ScreenshareOverlay
                    isWindowFocused={isWindowFocused}
                    screenshareStream={client.stream}
                    useBlur={useBlur}
                    withRoundedCorners={withRoundedCorners}
                />
            )}
            <VideoElement
                clientId={client.clientId}
                ref={videoElementRef}
                stream={client.stream}
                onVideoLoaded={handleVideoLoaded}
                onVideoResized={handleVideoResized}
            />
            {audioStream && (
                <AudioElement
                    ref={audioElementRef}
                    muted={!!client.isLocalClient || client.localVolume === 0 || isInCoLocationGroupWithLoudSpeaker}
                    volume={client.localVolume}
                    stream={audioStream}
                    featureVolumeMuteOn={true}
                />
            )}
        </>,
        target
    );
};

export default MediaPortal;
