import { useState, useEffect, useCallback, memo } from "react";
import { Flex } from "@chakra-ui/react";
import { motion, AnimatePresence, usePresence } from "framer-motion";

import { RoomConnectionRef, GameState } from "../../useQuizGame";

import VideoTile from "../VideoTile";

interface ParticipantsProps {
    roomConnection: RoomConnectionRef;
    quizState: GameState;
    variant?: "default" | "small";
    screen?: "scoreboard" | "game";
}

const SORTING_TIMEOUT = 4500;

const Participants = ({ roomConnection, quizState, variant = "default", screen = "game" }: ParticipantsProps) => {
    const { state: roomState } = roomConnection;
    const { remoteParticipants, localParticipant } = roomState;

    const [tiles, setTiles] = useState([...remoteParticipants, localParticipant]);
    const [isPresent, safeToRemove] = usePresence();
    const [roundResults, setRoundResults] = useState<{
        [participantId: string]: "correct" | "incorrect" | "no_vote";
    }>({});

    const { revealAnswers, currentAnswers, currentQuestion, scores } = quizState;
    // TODO: fix currentAnswers interface

    const sortTiles = useCallback(() => {
        const shuffled = [...tiles].sort((a, b) => {
            const aId = a?.id || "unknown";
            const aName = a?.displayName || "Unknown";
            const bId = b?.id || "unknown";
            const bName = b?.displayName || "Unknown";

            const aScore = scores[aId] || 0;
            const bScore = scores[bId] || 0;

            if (aScore === bScore) {
                if (aName >= bName) {
                    return -1;
                } else {
                    return 1;
                }
            } else if (aScore > bScore) {
                return -1;
            } else {
                return 1;
            }
        });

        setTiles(shuffled);
    }, [scores, tiles]);

    // Should only be triggered when participants change
    useEffect(() => {
        const allParticipants = [...remoteParticipants, localParticipant];

        setTiles(allParticipants);
    }, [remoteParticipants, localParticipant]);

    // Sort on scoreboard view
    useEffect(() => {
        if (screen === "scoreboard") {
            const timer = setTimeout(() => {
                sortTiles();
            }, SORTING_TIMEOUT);

            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen]);

    // Should only be triggered when revealAnswers changes - don't change dep array
    useEffect(() => {
        if (revealAnswers) {
            const timer = setTimeout(() => {
                sortTiles();
            }, SORTING_TIMEOUT);

            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [revealAnswers]);

    useEffect(() => {
        if (revealAnswers) {
            if (!currentAnswers) return;

            const results = tiles.reduce((res, tile) => {
                if (!tile) return res;

                const answer = currentQuestion?.correctAlternative;
                const result = currentAnswers[tile.id] === answer ? "correct" : "incorrect";

                return { ...res, [tile.id]: result };
            }, {});

            setRoundResults(results);
        } else {
            setRoundResults({});
        }
    }, [currentAnswers, currentQuestion?.correctAlternative, revealAnswers, sortTiles, tiles]);

    const tileSizeVariant = tiles.length > 8 ? "small" : variant;

    const transition = { type: "spring", stiffness: 500, damping: 50, mass: 1 };

    const animationProps = {
        layout: true,
        animate: isPresent ? "in" : "out",
        whileTap: "tapped",
        variants: {
            in: { scaleY: 1, opacity: 1 },
            out: { scaleY: 0, opacity: 0.5, zIndex: -1 },
            tapped: { scale: 0.98, opacity: 0.5, transition: { duration: 0.1 } },
        },
        transition,
        onAnimationComplete: () => !isPresent && safeToRemove(),
    };

    return (
        <Flex gap="4">
            <Flex
                flexDir={screen === "scoreboard" ? "column" : "row"}
                justifyContent={screen === "scoreboard" ? "center" : "flex-start"}
                w="100%"
            >
                <AnimatePresence mode="sync">
                    {tiles.map((participant) => {
                        if (!participant) return null;

                        const { id, stream, displayName } = participant;
                        const hasParticipantAnswered = !!(currentAnswers || {})[id];

                        return (
                            <motion.div {...animationProps} key={id}>
                                {stream ? (
                                    <VideoTile
                                        muted={localParticipant?.id === id}
                                        stream={stream}
                                        name={`${displayName} - ${scores[id] || 0} points`}
                                        hasAnswered={hasParticipantAnswered}
                                        roundResult={roundResults[id]}
                                        variant={tileSizeVariant}
                                    />
                                ) : (
                                    <div>No media</div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </Flex>
        </Flex>
    );
};

export default memo(Participants);
