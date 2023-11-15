import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
    initialColorMode: "light",
    useSystemColorMode: false,
};

const overrides = {
    fonts: {
        heading: `'Urbanist', sans-serif`,
        body: `'Urbanist', sans-serif`,
    },
    components: {
        Heading: {
            baseStyle: {
                fontWeight: 800,
            },
        },
    },
};

const theme = extendTheme({
    config,
    ...overrides,
});

export default theme;
