import assert from "@whereby/jslib-media/src/utils/assert";

/**
 * Asserts that value is truthy.
 *
 * @param value - The value to check.
 * @param {string} parameterName - The name of the parameter.
 */
export function assertTruthy(value: unknown, parameterName: string): unknown {
    assert.ok(value, `${parameterName} is required`);
    return value;
}

/**
 * Asserts that value is a number.
 *
 * @param value - The value to check.
 * @param {string} parameterName - The name of the parameter.
 */
export function assertBoolean(value: unknown, parameterName: string): boolean {
    assert.ok(typeof value === "boolean", `${parameterName}<boolean> is required`);
    return value;
}

/**
 * Asserts that value is a number.
 *
 * @param value - The value to check.
 * @param {string} parameterName - The name of the parameter.
 */
export function assertNumber(value: unknown, parameterName: string): number {
    assert.ok(typeof value === "number", `${parameterName}<number> is required`);
    return value;
}

/**
 * Asserts that value is a string.
 *
 * @param value - The value to check.
 * @param {string} parameterName - The name of the parameter.
 */
export function assertString(value: unknown, parameterName: string): string {
    assert.ok(typeof value === "string", `${parameterName}<string> is required`);
    return value;
}

/**
 * Asserts that value is of the provided type.
 *
 * @param value - The value to check.
 * @param type - The type that value should be.
 * @param {string} [parameterName] - The name of the parameter.
 */
export function assertInstanceOf<T>(value: unknown, type: new (any: unknown) => T, parameterName?: string): T {
    const resolvedParameterName = parameterName || type.name[0].toLowerCase() + type.name.substring(1);
    assert.ok(value instanceof type, `${resolvedParameterName}<${type.name}> is required`);
    return value;
}

/**
 * Asserts that the provided room name is a valid roomName.
 *
 * @param roomName - The roomName to check.
 * @param {string} [parameterName="roomName"] - The name of the parameter.
 */
export function assertRoomName(roomName: unknown, parameterName = "roomName"): string {
    assertString(roomName, parameterName);
    assert.ok(typeof roomName === "string" && roomName[0] === "/", `${parameterName} must begin with a '/'`);
    return roomName as string;
}

/**
 * Asserts that the provided array is a valid array.
 *
 * @param array - The array to check.
 * @param {string} [parameterName] - The name of the parameter.
 */
export function assertArray(array: unknown, parameterName: string): Array<unknown> {
    assert.ok(Array.isArray(array), `${parameterName}<array> is required`);
    return array as Array<unknown>;
}

/**
 * Asserts that value is one of the values provided in an array
 *
 * @param value - The value to check.
 * @param allowedValues - An array of allowed values
 * @param {string} parameterName - The name of the parameter.
 */
export function assertOneOf<T>(value: T, allowedValues: Array<unknown>, parameterName: string): T {
    assertTruthy(value, "value");
    assertArray(allowedValues, "allowedValues");

    const isAllowed = allowedValues.includes(value);
    if (!isAllowed) {
        throw new Error(`${parameterName}<string> must be one of the following: ${allowedValues.join(", ")}`);
    }

    return value;
}

/**
 * Asserts that the provided reference is of the provided primitive type.
 *
 * @param {*} ref - The reference (variable or constant) to test.
 * @param {string} type - The expected primitive type.
 * @param {string} name - The name of the reference, will be used in the error message.
 * @param {string} [message] - A custom message to use when the assertion fails.
 */
export function assertType(ref: unknown, type: string, name: string, message?: string): void {
    assert.ok(typeof name === "string", "name must be of type string");
    const errorMessage = message || `${name} must be of type ${type}`;
    assert.ok(ref !== null && typeof ref === type, errorMessage);
}

/**
 * Asserts that the provided reference is a record.
 *
 * @param {*} ref - The reference (variable or constant) to test.
 * @param {string} name - The name of the reference, will be used in the error message.
 */
export function assertRecord(ref: unknown, name: string): Record<string, unknown> {
    if (ref === null || ref === undefined || typeof ref !== "object" || Array.isArray(ref)) {
        throw new Error(`${name} must be a record. ${JSON.stringify(ref)}`);
    }

    return ref as Record<string, unknown>;
}

/**
 * Asserts that the provided reference is either null or of the provided primitive type.
 *
 * @param {*} ref - The reference (variable or constant) to test.
 * @param {string} type - The expected primitive type.
 * @param {string} name - The name of the reference, will be used in the error message.
 * @param {string} [message] - A custom message to use when the assertion fails.
 */
export function assertNullOrType(ref: unknown, type: string, name: string, message?: string): void {
    assertString(name, "name");
    const errorMessage = message || `${name} must be null or of type ${type}`;
    assert.ok(ref === null || typeof ref === type, errorMessage);
}

/**
 * Asserts that the provided reference is either null or a boolean.
 *
 * @param {*} ref - The reference (variable or constant) to test.
 * @param {string} name - The name of the reference, will be used in the error message.
 * @param {string} [message] - A custom message to use when the assertion fails.
 */
export function assertNullOrBoolean(ref: unknown, name: string, message?: string): void {
    assertString(name, "name");
    assertNullOrType(ref, "boolean", name, message);
}

/**
 * Asserts that the provided reference is either null or a string.
 *
 * @param {*} ref - The reference (variable or constant) to test.
 * @param {string} name - The name of the reference, will be used in the error message.
 * @param {string} [message] - A custom message to use when the assertion fails.
 */
export function assertNullOrString(ref: unknown, name: string, message?: string): void {
    assertString(name, "name");
    assertNullOrType(ref, "string", name, message);
}
