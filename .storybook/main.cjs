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
    previewHead: (head) => `
        ${head}
        <style>
        .bouncingball {
            width:140px;
            height:140px;
            border-radius:100%;
            background:#CCC;
            animation: bounce 1s;
            transform: translateY(0px);
            animation-iteration-count: infinite;
            position:absolute;
            margin:50px;
            overflow: hidden;
          }
          
          @keyframes bounce {
              0% {top: 0;
                  -webkit-animation-timing-function: ease-in;
              }
              40% {}
              50% {top: 140px;
                  height: 140px;
                  -webkit-animation-timing-function: ease-out;
              }
              55% {top: 160px; height: 120px; 
                  -webkit-animation-timing-function: ease-in;}
              65% {top: 120px; height: 140px; 
                  -webkit-animation-timing-function: ease-out;}
              95% {
                  top: 0;		
                  -webkit-animation-timing-function: ease-in;
              }
              100% {top: 0;
                  -webkit-animation-timing-function: ease-in;
              }
          }
        </style>
    `,
};
