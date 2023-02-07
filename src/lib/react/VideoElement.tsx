import React, { useCallback } from "react";

interface VideoElementSelfProps {
    stream: MediaStream;
    style?: React.CSSProperties;
}

type VideoElementProps = VideoElementSelfProps &
    React.DetailedHTMLProps<React.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>;

export default ({ stream, ...rest }: VideoElementProps) => {
    const videoEl = useCallback<(node: HTMLVideoElement) => void>((node) => {
        if (node !== null && node.srcObject !== stream) {
            node.srcObject = stream;
        }
    }, []);

    return <video ref={videoEl} autoPlay playsInline {...rest} />;
};
