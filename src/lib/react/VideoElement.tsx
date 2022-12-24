import React, { useCallback } from "react";

interface VideoElProps {
    stream: MediaStream;
    style?: React.CSSProperties;
}

export default ({ stream, style }: VideoElProps) => {
    const videoEl = useCallback<(node: HTMLVideoElement) => void>((node) => {
        if (node !== null && node.srcObject !== stream) {
            node.srcObject = stream;
        }
    }, []);

    return <video ref={videoEl} autoPlay playsInline style={style} />;
};
