import QRCode from "react-qr-code";
import { Box, Heading } from "@chakra-ui/react";
import { PROD_URL } from "../../config/room";

const qrCodeSize = [null, "120px", null, "240px"];

const QR = () => {
    return (
        <Box
            display={["none", "block"]}
            h={qrCodeSize}
            w={qrCodeSize}
            position="absolute"
            right="10"
            top="10"
            p="4"
            background="whiteAlpha.500"
            borderRadius="2xl"
        >
            <QRCode value={PROD_URL} style={{ height: "100%", width: "100%" }} />
            <Heading as="h4" mt="6" fontSize="xl">
                Join the fun!
            </Heading>
        </Box>
    );
};

export default QR;
