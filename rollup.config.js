const dotenv = require("dotenv");
dotenv.config();
const nodeResolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const json = require("@rollup/plugin-json");
const replace = require("@rollup/plugin-replace");
const { terser } = require("rollup-plugin-terser");
const pkg = require("./package.json");
const typescript = require("rollup-plugin-typescript2");
const { dts } = require("rollup-plugin-dts");
const nodePolyfills = require("rollup-plugin-polyfill-node");

const peerDependencies = [...Object.keys(pkg.peerDependencies || {})];

function makeCdnFilename(package) {
    const major = pkg.version.split(".")[0];

    let tag = "";
    const preRelease = pkg.version.split("-")[1];
    if (preRelease) {
        tag = `-${preRelease.split(".")[0]}`;
    }

    let packagePart = "";
    if (package) {
        packagePart = `-${package}`;
    }

    return `v${major}${packagePart}${tag}.js`;
}

const replaceValues = {
    preventAssignment: true,
    values: {
        __SDK_VERSION__: pkg.version,
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
        "process.env.NODE_DEBUG": JSON.stringify(process.env.NODE_DEBUG),
        "process.env.AWF_BASE_URL": JSON.stringify(process.env.AWF_BASE_URL),
        "process.env.AWF_API_BASE_URL": JSON.stringify(process.env.AWF_API_BASE_URL),
        "process.env.AP_ROOM_BASE_URL": JSON.stringify(process.env.AP_ROOM_BASE_URL),
        "process.env.RTCSTATS_URL": JSON.stringify(process.env.RTCSTATS_URL || "wss://rtcstats.srv.whereby.com"),
        "process.env.REACT_APP_API_BASE_URL": JSON.stringify(
            process.env.REACT_APP_API_BASE_URL || "https://api.whereby.dev"
        ),
        "process.env.REACT_APP_SIGNAL_BASE_URL": JSON.stringify(
            process.env.REACT_APP_SIGNAL_BASE_URL || "wss://signal.appearin.net"
        ),
        "process.env.REACT_APP_IS_DEV": JSON.stringify(process.env.REACT_APP_IS_DEV),
    },
};

const plugins = [
    replace(replaceValues),
    replace({
        preventAssignment: true,
        // jslib-media uses global.navigator for some gUM calls, replace these
        delimiters: [" ", "."],
        values: { "global.navigator.mediaDevices": " navigator.mediaDevices." },
    }),
    nodeResolve({
        // only include @whereby/jslib-media and rtcstats in our bundle
        preferBuiltins: true,
        resolveOnly: [/@whereby\/jslib-media|rtcstats/],
    }),
    commonjs(),
    typescript(),
];

module.exports = [
    {
        input: "src/lib/core/index.ts",
        output: {
            exports: "named",
            file: "dist/core/index.js",
            format: "cjs",
        },
        plugins: [
            nodeResolve({
                browser: false,
                preferBuiltins: true,
            }),
            commonjs(),
            json(),
            replace(replaceValues),
            typescript(),
        ],
    },
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
        input: "src/lib/embed/index.ts",
        output: {
            exports: "named",
            file: "dist/embed/index.esm.js",
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
    // CDN builds
    {
        input: "src/lib/embed/index.ts",
        output: {
            file: `dist/cdn/${makeCdnFilename("embed")}`,
            format: "iife",
            name: "whereby",
        },
        plugins: [nodeResolve(), commonjs(), json(), terser(), replace(replaceValues), typescript()],
    },
    {
        input: "src/lib/react/index.ts",
        output: {
            file: `dist/cdn/${makeCdnFilename("react")}`,
            format: "iife",
            name: "whereby.react",
            globals: {
                react: "React",
            },
        },
        external: [...peerDependencies],
        plugins: [
            commonjs(), // Needs to come before `nodePolyfills`
            nodePolyfills(),
            nodeResolve({ browser: true, preferBuiltins: false }),
            json(),
            terser(),
            replace({
                preventAssignment: true,
                // jslib-media uses global.navigator for some gUM calls, replace these
                delimiters: [" ", "."],
                values: { "global.navigator.mediaDevices": " navigator.mediaDevices." },
            }),
            replace(replaceValues),
            typescript(),
        ],
    },

    // Type definitions
    {
        input: "src/lib/core/index.ts",
        output: [{ file: "dist/core/index.d.ts", format: "es" }],
        external: ["@whereby/jslib-media/src/webrtc/RtcManager"],
        plugins: [dts()],
    },
    {
        input: "src/lib/react/index.ts",
        output: [{ file: "dist/react/index.d.ts", format: "es" }],
        external: ["@whereby/jslib-media/src/webrtc/RtcManager"],
        plugins: [dts()],
    },
    {
        input: "src/lib/embed/index.ts",
        output: [{ file: "dist/embed/index.d.ts", format: "es" }],
        plugins: [dts()],
    },
    {
        input: "src/lib/utils/index.ts",
        output: [{ file: "dist/utils/index.d.ts", format: "es" }],
        plugins: [dts()],
    },
];
