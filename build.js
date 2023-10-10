import { build } from "esbuild";
import { replace } from "esbuild-plugin-replace";
import pkg from "./package.json" assert { type: "json" };

function makeCdnFilename() {
    const major = pkg.version.split(".")[0];
    const preRelease = pkg.version.split("-")[1];
    let tag = "";

    if (preRelease) {
        tag = `-${preRelease.split(".")[0]}`;
    }

    return `v${major}${tag}.js`;
}

/**
 * we bundle jslib-media because webpack has issues resolving imports from it
 *
 * we bundle events because webpack tries to `require` it in the bundle which
 * causes `Dynamic require of "events" is not supported` when jslib-media imports
 * from mediasoup-client
 * */
const external = Object.keys(pkg.dependencies)
    .concat(Object.keys(pkg.peerDependencies))
    .filter((dep) => !dep.match(/jslib-media|events/));

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

// full package
build({
    ...sharedConfig,
    entryPoints: ["src/lib/index.ts"],
    outfile: "dist/index.esm.js",
});

// embed with dependencies
build({
    ...sharedConfig,
    external: undefined,
    packages: undefined,
    entryPoints: ["src/lib/embed/index.ts"],
    outfile: `dist/${makeCdnFilename()}`,
});
