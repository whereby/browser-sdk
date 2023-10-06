import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import typescript from "rollup-plugin-typescript2";
import dts from "rollup-plugin-dts";
import incremental from "@mprt/rollup-plugin-incremental";
import { peerDependencies, replaceValues } from "./rollup.config";

const plugins = [incremental(), replace(replaceValues), commonjs(), typescript(), incremental.fixSNE()];

export default [
    {
        input: "src/lib/index.ts",
        treeshake: false,
        output: {
            exports: "named",
            dir: "build",
            format: "esm",
            preserveModules: true,
            preserveModulesRoot: "src",
            minifyInternalExports: false,
        },
        external: ["heresy", ...peerDependencies],
        plugins,
    },

    {
        input: "./build/lib/index.d.ts",
        treeshake: false,
        output: [
            {
                dir: "build",
                format: "es",
                preserveModules: true,
                preserveModulesRoot: "src",
                minifyInternalExports: false,
            },
        ],
        plugins: [dts()],
    },
];
