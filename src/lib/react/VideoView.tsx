import React, { useCallback } from "react";

interface VideoViewSelfProps {
    stream: MediaStream;
    style?: React.CSSProperties;
}

type VideoViewProps = VideoViewSelfProps &
    React.DetailedHTMLProps<React.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>;

export default ({ stream, ...rest }: VideoViewProps) => {
    const videoEl = useCallback<(node: HTMLVideoElement) => void>((node) => {
        if (node !== null && node.srcObject !== stream) {
            node.srcObject = stream;
        }
    }, []);

    return <video ref={videoEl} autoPlay playsInline {...rest} />;
};
