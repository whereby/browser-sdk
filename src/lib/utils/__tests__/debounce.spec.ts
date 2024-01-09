import { jest } from "@jest/globals";

import debounce from "../debounce";

jest.useFakeTimers();

describe("debounce", () => {
    let fn: jest.Mock;

    beforeEach(() => {
        fn = jest.fn();
        jest.spyOn(global, "setTimeout");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should set the timer with the specified delay", () => {
        const delay = Math.floor(Math.random() * 2000);

        const debouncedFn = debounce(fn, { delay });
        debouncedFn();

        expect(setTimeout).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), delay);
    });

    it("should call the debounced function only after the delay has passed", () => {
        const debouncedFn = debounce(fn);

        debouncedFn();
        expect(fn).not.toHaveBeenCalled();

        jest.runAllTimers();
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should call the debounced function with the provided arguments", () => {
        const arg1 = {};
        const arg2 = Math.random();
        const debouncedFn = debounce(fn);

        debouncedFn(arg1, arg2);
        jest.runAllTimers();

        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(arg1, arg2);
    });

    it("should call the debounced function only once", () => {
        const debouncedFn = debounce(fn);

        debouncedFn();
        debouncedFn();

        jest.runAllTimers();
        expect(fn).toHaveBeenCalledTimes(1);
    });

    describe("with edges: true", () => {
        it("should call the debounced function first and then once more at end", () => {
            const debouncedFn = debounce(fn, { edges: true });

            debouncedFn();
            debouncedFn();
            debouncedFn();
            debouncedFn();

            expect(fn).toHaveBeenCalledTimes(1);
            jest.runAllTimers();
            expect(fn).toHaveBeenCalledTimes(2);
        });

        it("should call the debounced function again after time has elapsed", () => {
            const debouncedFn = debounce(fn, { edges: true });

            debouncedFn();
            expect(fn).toHaveBeenCalledTimes(1);
            jest.runAllTimers();
            expect(fn).toHaveBeenCalledTimes(1);
            debouncedFn();

            expect(fn).toHaveBeenCalledTimes(2);
        });
    });
});
