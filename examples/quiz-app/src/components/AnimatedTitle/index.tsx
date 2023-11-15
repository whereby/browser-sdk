import React from "react";
import { motion } from "framer-motion";
import { Flex, Text } from "@chakra-ui/react";

interface TitleProps {
    children: string | undefined;
}

const MotionFlex = motion(Flex);
const MotionText = motion(Text);

const Title = ({ children }: TitleProps) => {
    const words = children?.split(" ");

    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.22, delayChildren: 0.04 * i },
        }),
    };

    const child = {
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 100,
            },
        },
        hidden: {
            opacity: 0,
            x: 20,
            transition: {
                type: "spring",
                damping: 24,
                stiffness: 100,
            },
        },
    };

    return (
        <MotionFlex
            flexWrap="wrap"
            variants={container}
            initial="hidden"
            animate="visible"
            exit="exit"
            justifyContent="center"
        >
            {words?.map((word, i) => (
                <MotionText key={i} variants={child} mr="5px" fontWeight="800">
                    {word}
                </MotionText>
            ))}
        </MotionFlex>
    );
};

export default Title;
