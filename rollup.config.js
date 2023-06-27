import nodeResolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";

const replaceValues = {
    preventAssignment: true,
    values: {
        __SDK_VERSION__: pkg.version,
    },
};

export default [
    // Commonjs build of lib, to be used with bundlers
    {
        input: "src/lib/index.js",
        output: {
            exports: "default",
            file: "dist/lib.cjs.js",
            format: "cjs",
        },
        external: ["heresy"],
        plugins: [replace(replaceValues)],
    },
    // Esm build of lib, to be used with bundlers
    {
        input: "src/lib/index.js",
        output: {
            exports: "default",
            file: "dist/lib.esm.js",
            format: "esm",
        },
        external: ["heresy"],
        plugins: [replace(replaceValues)],
    },
    // Legacy build of lib in ES format, bundling the dependencies
    {
        input: "src/lib/index.js",
        output: {
            exports: "default",
            file: `dist/v${pkg.version.split(".")[0]}.js`,
            format: "esm",
        },
        plugins: [nodeResolve(), terser(), replace(replaceValues)],
    },
];
