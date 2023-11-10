import { useState } from "react";
import { Box } from "@chakra-ui/react";
import { useLocalMedia } from "@whereby.com/browser-sdk/react";

import PreCallView from "./views/PreCallView";
import Game from "./views/Game";

import background from "./assets/background.svg";
import DeviceControls from "./components/DeviceControls";

function App({ roomUrl }: { roomUrl: string }) {
    const [isConnected, setIsConnected] = useState(false);
    const [displayName, setDisplayName] = useState("");
    const localMedia = useLocalMedia();

    const { localStream } = localMedia.state;
    const { toggleCameraEnabled, toggleMicrophoneEnabled } = localMedia.actions;

    return (
        <Box
            h="100%"
            textAlign="center"
            overflow="hidden"
            backgroundImage={`url(${background})`}
            backgroundPosition="center"
            backgroundSize="cover"
            backgroundRepeat="no-repeat"
        >
            {!isConnected ? (
                <PreCallView
                    localMedia={localMedia}
                    handleOnReady={(displayName) => {
                        setDisplayName(displayName);
                        setIsConnected(true);
                    }}
                />
            ) : (
                <Game roomUrl={roomUrl} localMedia={localMedia} displayName={displayName} />
            )}

            {localStream && (
                <DeviceControls
                    floating={isConnected}
                    toggleCameraEnabled={toggleCameraEnabled}
                    toggleMicrophoneEnabled={toggleMicrophoneEnabled}
                    localStream={localStream}
                />
            )}
        </Box>
    );
}

export default App;
