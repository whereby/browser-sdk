import { useState } from "react";
import { motion } from "framer-motion";
import { Box, Button, Center, Heading, Text, VStack } from "@chakra-ui/react";

import AnimatedTitle from "../../components/AnimatedTitle";
import { GameActions } from "../../useQuizGame";
import QR from "../../components/QR";

interface LobbyViewProps {
    isQuizMaster: boolean;
    playerCount: number;
    quizActions: GameActions;
}

const MotionButton = motion(Button);

const LobbyView = ({ playerCount, quizActions, isQuizMaster }: LobbyViewProps) => {
    const [buttonClicked, setButtonClicked] = useState(false);

    const buttonVariants = {
        hover: {
            scale: 1.25,
            backgroundColor: "#38A169",
            transition: {
                type: "spring",
                stiffness: 200,
                mass: 1,
                damping: 1,
            },
        },
        pressed: {
            scale: 1.2,
        },
    };

    const handleOnReady = () => {
        setButtonClicked(true);
        quizActions.start();
    };

    return (
        <VStack height="100%">
            <Box>
                <Heading as="h1" mt="10" mb="4">
                    <AnimatedTitle>Game Lobby</AnimatedTitle>
                </Heading>
                <Text>Waiting for players...</Text>
            </Box>
            <QR />
            <Center flexDirection="column" h="100%" w="100%" color="white">
                <Text fontSize="2xl" fontWeight="bold" mb="4">
                    {playerCount} Player{playerCount !== 1 && "s"}
                </Text>
                {isQuizMaster ? (
                    <MotionButton
                        onClick={handleOnReady}
                        background="green.500"
                        w="50%"
                        py="10"
                        size="md"
                        fontSize="2xl"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="pressed"
                    >
                        {buttonClicked ? "Let's go!" : "Start Game"}
                    </MotionButton>
                ) : (
                    <Text fontSize="lg" mb="4">
                        Waiting for quiz master to start the game...
                    </Text>
                )}
            </Center>
        </VStack>
    );
};

export default LobbyView;
