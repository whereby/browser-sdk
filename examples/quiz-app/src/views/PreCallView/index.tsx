import { useEffect, useState } from "react";
import { Input, Button, Box, Flex, Heading, Text, Spinner } from "@chakra-ui/react";
import { FiCheck } from "react-icons/fi";

import { LocalMediaRef } from "../../useQuizGame";
import VideoTile from "../../components/VideoTile";

interface PreCallViewProps {
    handleOnReady: (name: string) => void;
    localMedia: LocalMediaRef;
}

const PreCallView = ({ localMedia, handleOnReady }: PreCallViewProps) => {
    const { currentCameraDeviceId, cameraDevices, localStream, currentMicrophoneDeviceId, microphoneDevices } =
        localMedia.state;
    const { setCameraDevice, setMicrophoneDevice } = localMedia.actions;

    const [displayName, setDisplayName] = useState("");
    const [hasInitialized, setHasInitialized] = useState(false);
    const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => setDisplayName(event.target.value);

    useEffect(() => {
        if (cameraDevices.length || microphoneDevices.length) {
            setHasInitialized(true);
        }
    }, [cameraDevices, microphoneDevices]);

    useEffect(() => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = false;
            }
        }
    }, [localStream]);

    const selectedDeviceStyleProps = {
        border: "1px solid #4880c8",
        fontWeight: "bold",
        rightIcon: <FiCheck />,
    };

    return (
        <Box>
            <Heading mt="10" mb="4">
                Join the game!
            </Heading>
            <Box w="50%" my={4} margin="0 auto">
                {hasInitialized ? (
                    <>
                        <VideoTile muted stream={localStream} />
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleOnReady(displayName);
                            }}
                        >
                            <Flex justifyContent="center" gap="2" mt="4">
                                <Input
                                    autoFocus
                                    w="50%"
                                    placeholder="Your name... (required)"
                                    value={displayName}
                                    onChange={handleTextChange}
                                ></Input>
                                <Button isDisabled={displayName.length === 0} type={"submit"}>
                                    Ready!
                                </Button>
                            </Flex>
                        </form>

                        <Box my="4">
                            <Heading as="h3" mb="2" size="md">
                                Camera device
                            </Heading>
                            {cameraDevices.map((d) => {
                                const currentDevice = currentCameraDeviceId === d.deviceId;
                                return (
                                    <Button
                                        key={d.deviceId}
                                        mb="2"
                                        backgroundColor="transparent"
                                        onClick={() => !currentDevice && setCameraDevice(d.deviceId)}
                                        {...(currentDevice && { ...selectedDeviceStyleProps })}
                                    >
                                        {d.label}
                                    </Button>
                                );
                            })}
                        </Box>

                        <Box display={"flex"} flexDirection={"column"} alignItems={"center"} my="4">
                            <Heading as="h3" mb="2" size="md">
                                Microphone device
                            </Heading>
                            {microphoneDevices.map((d) => {
                                const currentDevice = currentMicrophoneDeviceId === d.deviceId;

                                return (
                                    <Button
                                        key={d.deviceId}
                                        mb="2"
                                        backgroundColor="transparent"
                                        {...(currentDevice && { ...selectedDeviceStyleProps })}
                                        onClick={() => !currentDevice && setMicrophoneDevice(d.deviceId)}
                                    >
                                        {d.label}
                                    </Button>
                                );
                            })}
                        </Box>
                    </>
                ) : (
                    <Box>
                        <Text>Initializing, please allow access to your camera and microphone</Text>
                        <Spinner
                            my="4"
                            thickness="4px"
                            speed="0.65s"
                            emptyColor="gray.200"
                            color="blue.500"
                            size="xl"
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default PreCallView;
