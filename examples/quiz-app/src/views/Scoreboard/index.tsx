import { GameState, RoomConnectionRef } from "../../useQuizGame";
import { motion } from "framer-motion";

import { Heading, Box } from "@chakra-ui/react";
import Participants from "../../components/Participants";

interface ScoreboardProps {
    quizState: GameState;
    roomConnection: RoomConnectionRef;
    style?: React.CSSProperties;
    variant: "end" | "in-game";
}

export default function Scoreboard({ quizState, roomConnection, style }: ScoreboardProps) {
    return (
        <div style={style}>
            <Heading my="8">Final Scores</Heading>
            <motion.div layout>
                <Box mb="8">
                    <Participants
                        roomConnection={roomConnection}
                        quizState={quizState}
                        variant="small"
                        screen="scoreboard"
                    />
                </Box>
            </motion.div>
        </div>
    );
}
