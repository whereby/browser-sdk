import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";
import typescript from "rollup-plugin-typescript2";

const replaceValues = {
    preventAssignment: true,
    values: {
        __SDK_VERSION__: pkg.version,
    },
};

export default [
    // Commonjs build of lib, to be used with bundlers
    {
        input: "src/lib/index.ts",
        output: {
            exports: "default",
            file: "dist/lib.cjs.js",
            format: "cjs",
        },
        external: ["heresy"],
        plugins: [nodeResolve({ resolveOnly: [/jslib-commons/] }), replace(replaceValues), typescript()],
    },
    // Esm build of lib, to be used with bundlers
    {
        input: "src/lib/index.ts",
        output: {
            exports: "default",
            file: "dist/lib.esm.js",
            format: "esm",
        },
        external: ["heresy"],
        plugins: [nodeResolve({ resolveOnly: [/jslib-commons/] }), replace(replaceValues), typescript()],
    },
    // Legacy build of lib in ESM format, bundling the dependencies
    {
        input: "src/lib/index.ts",
        output: {
            exports: "default",
            file: `dist/v${pkg.version.split(".")[0]}.js`,
            format: "esm",
        },
        plugins: [nodeResolve(), commonjs(), json(), terser(), replace(replaceValues), typescript()],
    },
];
