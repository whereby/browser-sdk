import { Box, Code, Heading, Text } from "@chakra-ui/react";

function AppHelp() {
    return (
        <Box
            display={"flex"}
            alignItems={"center"}
            justifyContent={"center"}
            flexDirection={"column"}
            margin={"auto auto"}
            width={"100%"}
            height={"100%"}
        >
            <Heading mb={"4"}>Missing game parameters</Heading>
            <Text mb={"2"}>
                To play the quiz game, please provide a valid url to an <strong>UNLOCKED</strong> Whereby room created
                on the Embedded plan.
            </Text>
            <Code>{window.location.href}?roomUrl=&lt;whereby_room_url&gt;</Code>
            <Text mt={"4"} mb={"2"}>
                To join as the quiz master, please also include
            </Text>
            <Code>{window.location.href}?roomUrl=&lt;whereby_room_url&gt;&quizMaster=true</Code>
        </Box>
    );
}

export default AppHelp;
