const { build } = require("esbuild");
const { replace } = require("esbuild-plugin-replace");
const pkg = require("./package.json");

function makeCdnFilename() {
    const major = pkg.version.split(".")[0];
    const preRelease = pkg.version.split("-")[1];
    let tag = "";

    if (preRelease) {
        tag = `-${preRelease.split(".")[0]}`;
    }

    return `v${major}${tag}.js`;
}

// embedded CDN
build({
    bundle: true,
    entryPoints: ["src/lib/embed/index.ts"],
    external: undefined,
    format: "esm",
    minify: process.env.NODE_ENV === "production",
    outfile: `dist/${makeCdnFilename()}`,
    platform: "browser",
    packages: undefined,
    plugins: [
        replace({
            __SDK_VERSION__: pkg.version,
            "process.env.NODE_DEBUG": JSON.stringify(process.env.NODE_DEBUG),
            "process.env.AWF_BASE_URL": JSON.stringify(process.env.AWF_BASE_URL),
            "process.env.AWF_API_BASE_URL": JSON.stringify(process.env.AWF_API_BASE_URL),
            "process.env.AP_ROOM_BASE_URL": JSON.stringify(process.env.AP_ROOM_BASE_URL),
        }),
    ],
    target: ["es6"],
    treeShaking: process.env.NODE_ENV === "production",
});
