module.exports = {
    stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
    addons: ["@storybook/addon-links", "@storybook/addon-essentials"],
    framewkork: "@storybook/react",

    webpackFinal: async (config) => {
        config.module.rules.push({
            resolve: {
                fullySpecified: false,
                extensions: [".js", ".ts", ".tsx"],
            },
        });

        return config;
    },

    framework: {
        name: "@storybook/react-webpack5",
        options: {}
    },

    docs: {
        autodocs: true
    }
};
