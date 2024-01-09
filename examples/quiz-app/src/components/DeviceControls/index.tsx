import { Box, Icon, IconButton } from "@chakra-ui/react";
import { useState } from "react";
import { FiMic, FiVideo, FiVideoOff, FiMicOff } from "react-icons/fi";

interface DeviceControlProps {
    floating?: boolean;
    localStream: MediaStream;
    style?: React.CSSProperties;
    toggleCameraEnabled: () => void;
    toggleMicrophoneEnabled: () => void;
}

export default function DeviceControls({
    floating,
    localStream,
    style,
    toggleCameraEnabled,
    toggleMicrophoneEnabled,
}: DeviceControlProps) {
    const [isCameraEnabled, setIsCameraEnabled] = useState(localStream.getVideoTracks()[0]?.enabled);
    const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(localStream.getAudioTracks()[0]?.enabled);

    let styles = {};
    if (floating) {
        styles = {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
        };
    }

    return (
        <Box pb={"4"} {...styles} style={style}>
            <IconButton
                colorScheme={!isCameraEnabled ? "red" : undefined}
                size={"lg"}
                mr={"2"}
                aria-label="Camera"
                icon={<Icon as={isCameraEnabled ? FiVideo : FiVideoOff} />}
                onClick={() => {
                    toggleCameraEnabled();
                    setIsCameraEnabled(!isCameraEnabled);
                }}
            />
            <IconButton
                colorScheme={!isMicrophoneEnabled ? "red" : undefined}
                size={"lg"}
                aria-label="Microphone"
                icon={<Icon as={isMicrophoneEnabled ? FiMic : FiMicOff} />}
                onClick={() => {
                    toggleMicrophoneEnabled();
                    setIsMicrophoneEnabled(!isMicrophoneEnabled);
                }}
            />
        </Box>
    );
}
