import { build } from "esbuild";

const sharedConfig = {
    bundle: true,
    packages: "external",
    format: "esm",
    minify: true,
    platform: "browser",
    target: ["es2016"],
    treeShaking: true,
};

// full package
build({
    ...sharedConfig,
    entryPoints: ["src/lib/index.ts"],
    outfile: "dist/index.esm.js",
});

// react hooks
build({
    ...sharedConfig,
    entryPoints: ["src/lib/react/index.ts"],
    outfile: "dist/react/index.esm.js",
});

// embed
build({
    ...sharedConfig,
    entryPoints: ["src/lib/embed/index.ts"],
    outfile: "dist/embed/index.esm.js",
});

// embed with dependencies
build({
    ...sharedConfig,
    external: undefined,
    packages: undefined,
    entryPoints: ["src/lib/embed/index.ts"],
    outfile: "dist/embed.esm.js",
});
