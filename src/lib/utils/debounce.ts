interface Options {
    delay?: number;
    edges?: boolean;
}

export interface DebouncedFunction {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: any[]): void;
}

/**
 * Debounce function.
 *
 * @param {Function} fn - Function to debounce.
 * @param {Object} [options] - Options.
 * @param {number} [options.delay=500] - Delay in milliseconds.
 * @param {boolean} [options.edges=false] - Whether to call the function on the
 * leading and trailing edges of the wait timeout.
 * @returns {Function} Debounced function.
 */
export default function debounce(fn: DebouncedFunction, { delay = 500, edges }: Options = {}): DebouncedFunction {
    let timeout: NodeJS.Timeout | undefined;
    let nCalls = 0;

    return (...args) => {
        nCalls += 1;
        if (edges && nCalls === 1) {
            fn(...args);
        }
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            if (!edges || nCalls > 1) {
                fn(...args);
            }
            timeout = undefined;
            nCalls = 0;
        }, delay);
    };
}
