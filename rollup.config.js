const nodeResolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const json = require("@rollup/plugin-json");
const replace = require("@rollup/plugin-replace");
const { terser } = require("rollup-plugin-terser");
const pkg = require("./package.json");
const typescript = require("rollup-plugin-typescript2");
const { dts } = require("rollup-plugin-dts");

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

const replaceValues = {
    preventAssignment: true,
    values: {
        __SDK_VERSION__: pkg.version,
        "process.env.NODE_DEBUG": JSON.stringify(process.env.NODE_DEBUG),
        "process.env.AWF_BASE_URL": JSON.stringify(process.env.AWF_BASE_URL),
        "process.env.AWF_API_BASE_URL": JSON.stringify(process.env.AWF_API_BASE_URL),
        "process.env.AP_ROOM_BASE_URL": JSON.stringify(process.env.AP_ROOM_BASE_URL),
    },
};

const plugins = [
    replace(replaceValues),
    replace({
        // jslib-media uses global.navigator for some gUM calls, replace these
        delimiters: [" ", "."],
        values: { "global.navigator.mediaDevices": " navigator.mediaDevices." },
    }),
    nodeResolve({ preferBuiltins: true, resolveOnly: [/@whereby\/jslib-media/] }),
    commonjs(),
    typescript(),
];

module.exports = [
    // Esm build of lib, to be used with bundlers
    {
        input: "src/lib/react/index.ts",
        output: {
            exports: "named",
            file: "dist/react/index.esm.js",
            format: "esm",
        },
        external: ["heresy", ...peerDependencies],
        plugins,
    },
    {
        input: "src/lib/utils/index.ts",
        output: {
            exports: "named",
            file: "dist/utils/index.esm.js",
            format: "esm",
        },
        external: ["heresy", ...peerDependencies],
        plugins,
    },
    // Legacy build of lib in ESM format, bundling the dependencies
    /*{
        input: "src/lib/react/index.ts",
        output: {
            exports: "named",
            file: `dist/${makeCdnFilename()}`,
            format: "esm",
        },
        plugins: [nodeResolve(), commonjs(), json(), terser(), replace(replaceValues), typescript()],
    },*/
    // Roll-up .d.ts definition files
    {
        input: "src/lib/react/index.ts",
        output: [{ file: "dist/react/index.d.ts", format: "es" }],
        plugins: [dts()],
    },
    {
        input: "src/lib/utils/index.ts",
        output: [{ file: "dist/utils/index.d.ts", format: "es" }],
        plugins: [dts()],
    },
];
