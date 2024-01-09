import React, { useEffect, useRef } from "react";
import debounce from "../utils/debounce";

interface VideoViewSelfProps {
    stream: MediaStream;
    muted?: boolean;
    mirror?: boolean;
    style?: React.CSSProperties;
    onResize?: ({ width, height, stream }: { width: number; height: number; stream: MediaStream }) => void;
}

type VideoViewProps = VideoViewSelfProps &
    React.DetailedHTMLProps<React.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>;

export default ({ muted, mirror = false, stream, onResize, ...rest }: VideoViewProps) => {
    const videoEl = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (!videoEl.current || !onResize) {
            return;
        }

        const resizeObserver = new ResizeObserver(
            debounce(
                () => {
                    if (videoEl.current && stream?.id) {
                        onResize({
                            width: videoEl.current.clientWidth,
                            height: videoEl.current.clientHeight,
                            stream,
                        });
                    }
                },
                { delay: 1000, edges: true }
            )
        );

        resizeObserver.observe(videoEl.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [stream]);

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

    return (
        <video
            ref={videoEl}
            autoPlay
            playsInline
            {...rest}
            style={{ transform: mirror ? "scaleX(-1)" : "none", width: "100%", height: "100%", ...rest.style }}
        />
    );
};
