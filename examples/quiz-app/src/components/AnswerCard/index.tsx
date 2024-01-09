import { Button } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useMemo } from "react";

interface AnswerCardProps {
    answerText?: string;
    locked: boolean;
    isSelected: boolean;
    isCorrect: boolean;
    reveal: boolean;
    onSelected: () => void;
}

const ChakraButton = motion(Button);

const AnswerCard = ({ locked, answerText, onSelected, isSelected, isCorrect, reveal }: AnswerCardProps) => {
    const borderColor = useMemo(() => {
        if (reveal) {
            if (isCorrect) return "green.300";

            return "red.300";
        }

        if (isSelected) return "blue.300";

        return "";
    }, [isSelected, reveal, isCorrect]);

    return (
        <ChakraButton
            w="50%"
            h="100%"
            m="4"
            transition={{
                ease: "anticipate",
                duration: 2,
                delay: 2,
            }}
            borderColor={borderColor}
            borderWidth={isSelected || reveal ? "8px" : "0px"}
            onClick={onSelected}
            colorScheme="blackAlpha"
            fontSize="2xl"
        >
            {answerText}
        </ChakraButton>
    );
};
export default AnswerCard;
