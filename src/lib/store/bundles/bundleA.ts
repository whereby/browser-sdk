import { Store } from "..";

export interface BundleA {
    selectA: () => "A";

    doSomething: () => (store: Store) => void;
}
