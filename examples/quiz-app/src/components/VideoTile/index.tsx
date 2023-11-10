import { useEffect, useCallback, useMemo } from "react";
import { motion, useAnimate } from "framer-motion";
import { Box, Avatar, AvatarBadge, Text, Center } from "@chakra-ui/react";
import { VideoView } from "@whereby.com/browser-sdk/react";

interface VideoTileProps {
    muted?: boolean;
    id?: string;
    name?: string;
    stream: MediaStream | undefined;
    hasAnswered?: boolean;
    roundResult?: "correct" | "incorrect" | "no_vote" | null;
    variant?: "default" | "small";
}

const ChakraBox = motion(Box);

const VideoTile = ({ id, name, stream, hasAnswered, roundResult, muted, variant = "default" }: VideoTileProps) => {
    const [scope, animate] = useAnimate();

    const popAnimation = useCallback(async () => {
        await animate(scope.current, { scale: 1.5 });
        await animate(scope.current, { scale: 1 });
    }, [animate, scope]);

    const rotateAnimation = useCallback(async () => {
        await animate(scope.current, { rotate: -90 });
        await animate(scope.current, { scale: 1.5 });
        await animate(scope.current, { rotate: 0 });
        await animate(scope.current, { scale: 1 });
    }, [animate, scope]);

    const answeredAnimation = useCallback(async () => {
        await animate(scope.current, { rotate: -90 });
        await animate(scope.current, { rotate: 0 });
    }, [animate, scope]);

    const correctAnimation = useCallback(async () => {
        await animate(scope.current, { y: -120 }, { ease: "anticipate", duration: 2.25 });
        await animate(scope.current, { y: 0 }, { ease: "anticipate", duration: 0.65 });
    }, [animate, scope]);

    const incorrectAnimation = useCallback(async () => {
        await animate(scope.current, { x: [-20, 0] }, { type: "spring", stiffness: 500, mass: 1, damping: 5 });
    }, [animate, scope]);

    useEffect(() => {
        popAnimation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (stream) rotateAnimation();
    }, [stream, rotateAnimation]);

    useEffect(() => {
        if (hasAnswered) answeredAnimation();
    }, [hasAnswered, answeredAnimation]);

    useEffect(() => {
        if (roundResult === "correct") {
            correctAnimation();
        } else if (roundResult === "incorrect") {
            incorrectAnimation();
        }
    }, [correctAnimation, incorrectAnimation, popAnimation, roundResult]);

    const tileSize = variant === "small" ? "120px" : ["100px", "120px", "180px", "240px"];

    const borderColor = useMemo(() => {
        if (roundResult === "correct") {
            return "green.300";
        } else if (roundResult === "incorrect") {
            return "red.300";
        } else if (hasAnswered) {
            return "blue.300";
        }
        return "transparent";
    }, [roundResult, hasAnswered]);

    return (
        <ChakraBox
            display="flex"
            flexDirection="column"
            alignItems="center"
            margin="2"
            ref={scope}
            whileHover={{ scale: [null, 1.1, 1.05], rotate: 1 }}
            // @ts-ignore no problem in operation, although type error appears.
            transition={{
                ease: "easeOut",
                duration: 0.25,
                y: {
                    type: "spring",
                    duration: 2,
                },
            }}
        >
            <Center
                h={tileSize}
                w={tileSize}
                background="gray.200"
                borderRadius="16px"
                borderColor={borderColor}
                borderWidth={hasAnswered ? "8px" : "0px"}
                overflow="hidden"
            >
                {stream ? (
                    <Box as={VideoView} key={id} muted={muted} stream={stream} w="100%" h="100%" objectFit="cover" />
                ) : (
                    <Avatar size="xl" name={name}>
                        {hasAnswered && <AvatarBadge boxSize="1.25em" bg="blue.300" />}
                    </Avatar>
                )}
            </Center>
            <Text>{name}</Text>
        </ChakraBox>
    );
};

export default VideoTile;
