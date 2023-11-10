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
  const [toggle, setToggle] = useState(0);

  const cameraTrack = localStream.getVideoTracks()[0];
  const microphoneTrack = localStream.getAudioTracks()[0];

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
      {cameraTrack && (
        <IconButton
          colorScheme={!cameraTrack.enabled ? "red" : undefined}
          size={"lg"}
          mr={"2"}
          aria-label="Camera"
          icon={<Icon as={cameraTrack.enabled ? FiVideo : FiVideoOff} />}
          onClick={() => {
            setToggle(toggle + 1);
            toggleCameraEnabled();
          }}
        />
      )}
      {microphoneTrack && (
        <IconButton
          colorScheme={!microphoneTrack.enabled ? "red" : undefined}
          size={"lg"}
          aria-label="Microphone"
          icon={<Icon as={microphoneTrack.enabled ? FiMic : FiMicOff} />}
          onClick={() => {
            setToggle(toggle + 1);
            toggleMicrophoneEnabled();
          }}
        />
      )}
    </Box>
  );
}
