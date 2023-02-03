import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";
import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";
import typescript from "rollup-plugin-typescript2";
import dts from "rollup-plugin-dts";

const replaceValues = {
    preventAssignment: true,
    values: {
        __SDK_VERSION__: pkg.version,
    },
};

const peerDependencies = [...Object.keys(pkg.peerDependencies || {})];

function makeCdnFilename() {
    const major = pkg.version.split(".")[0];
    const preRelease = pkg.version.split("-")[1];
    let tag = "";

    if (preRelease) {
        tag = `-${preRelease.split(".")[0]}`;
    }

    return `v${major}${tag}.js`;
}

export default [
    // Commonjs build of lib, to be used with bundlers
    {
        input: "src/lib/index.ts",
        output: {
            exports: "named",
            file: "dist/lib.cjs.js",
            format: "cjs",
        },
        external: ["heresy", ...peerDependencies],
        plugins: [nodeResolve({ resolveOnly: [/jslib-media/] }), replace(replaceValues), typescript()],
    },
    // Esm build of lib, to be used with bundlers
    {
        input: "src/lib/index.ts",
        output: {
            exports: "named",
            file: "dist/lib.esm.js",
            format: "esm",
        },
        external: ["heresy", ...peerDependencies],
        plugins: [nodeResolve({ resolveOnly: [/jslib-media/] }), replace(replaceValues), typescript()],
    },
    // Legacy build of lib in ESM format, bundling the dependencies
    {
        input: "src/lib/index.ts",
        output: {
            exports: "named",
            file: `dist/${makeCdnFilename()}`,
            format: "esm",
        },
        plugins: [nodeResolve(), commonjs(), json(), terser(), replace(replaceValues), typescript()],
    },
    // Roll-up .d.ts definition files
    {
        input: "./dist/lib/index.d.ts",
        output: [{ file: "dist/types.d.ts", format: "es" }],
        plugins: [dts()],
    },
];
