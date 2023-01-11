import { useEffect, useState } from "react";

export default function useLocalMedia() {
    const [localStream, setLocalStream] = useState<MediaStream | undefined>(undefined);

    useEffect(() => {
        const getLocalStream = async () => {
            if (!localStream) {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                setLocalStream(stream);
            }
        };

        getLocalStream();

        // Stop tracks on unmount
        return () => {
            localStream?.getTracks().forEach((t) => {
                t.stop();
            });
        };
    }, [localStream]);

    return [localStream];
}
