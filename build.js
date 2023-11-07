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

const external = Object.keys(pkg.dependencies)
    .concat(Object.keys(pkg.peerDependencies))
    .filter((dep) => !dep.match(/jslib-media/));

const sharedConfig = {
    bundle: true,
    external,
    format: "esm",
    minify: process.env.NODE_ENV === "production",
    platform: "browser",
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
};

// React build
build({
    ...sharedConfig,
    entryPoints: ["src/lib/react/index.ts"],
    outfile: "dist/react/index.js",
});

// Embed build
build({
    ...sharedConfig,
    entryPoints: ["src/lib/embed/index.ts"],
    outfile: "dist/embed/index.js",
});

// Utils
build({
    ...sharedConfig,
    entryPoints: ["src/lib/utils/index.ts"],
    outfile: "dist/utils/index.js",
});

// embedded CDN
build({
    ...sharedConfig,
    entryPoints: ["src/lib/embed/index.ts"],
    external: undefined,
    outfile: `dist/${makeCdnFilename()}`,
    packages: undefined,
});
