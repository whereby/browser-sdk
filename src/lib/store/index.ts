import { BundleA } from "./bundles/bundleA";
import { BundleB } from "./bundles/bundleB";

export type Store = BundleA & BundleB;

let a: Store;
