export default class DummyStore implements Storage {
    [name: string]: unknown;
    length: number;

    constructor() {
        this.length = 0;
    }
    clear(): void {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getItem(_key: string): string | null {
        return "{}";
    }
    key(): string | null {
        throw new Error("Method not implemented.");
    }
    removeItem(): void {
        throw new Error("Method not implemented.");
    }
    setItem(): void {
        // NOP
    }
}
