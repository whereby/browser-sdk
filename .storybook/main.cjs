module.exports = {
    core: { builder: "webpack5" },
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
};
