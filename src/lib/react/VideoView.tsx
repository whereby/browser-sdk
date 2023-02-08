import React, { useEffect, useRef } from "react";

interface VideoViewSelfProps {
    stream: MediaStream;
    style?: React.CSSProperties;
}

type VideoViewProps = VideoViewSelfProps &
    React.DetailedHTMLProps<React.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>;

export default ({ muted, stream, ...rest }: VideoViewProps) => {
    const videoEl = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!videoEl.current) {
            return;
        }

        if (videoEl.current.srcObject !== stream) {
            videoEl.current.srcObject = stream;
        }

        // Handle muting programatically, not as video attribute
        // https://stackoverflow.com/questions/14111917/html5-video-muted-but-still-playing
        if (videoEl.current.muted !== muted) {
            videoEl.current.muted = Boolean(muted);
        }
    }, [muted, stream, videoEl]);

    return <video ref={videoEl} autoPlay playsInline {...rest} />;
};
