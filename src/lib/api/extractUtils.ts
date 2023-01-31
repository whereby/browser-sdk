import { assertArray, assertBoolean, assertNumber, assertRecord, assertString } from "./parameterAssertUtils";
import { Json } from "./Response";

export type Extractor<T> = (data: Json, propertyName: string) => T;
export type Transformer<T> = (data: Json) => T;

/**
 * Utility function to transform the given transformer function into a
 * function that handles `undefined` and `null` values.
 *
 * @param transformer - Function to transform
 * @returns the transformed function.
 */
export function nullOrTransform<T>(transform: Transformer<T>): Transformer<T | null> {
    return (data: Json): T | null => {
        return data === null || data === undefined ? null : transform(data);
    };
}

/**
 * Utility function to transform the given extract function to allow
 * `undefined` and `null` values.
 * @param extract - Function to transform
 * @returns the transformed function.
 */
export function nullOrExtract<T>(extract: Extractor<T>): Extractor<T | null> {
    return (data: Json, propertyName: string): T | null => {
        const record = assertRecord(data, "data");

        const value = record[propertyName];
        return value === null || value === undefined ? null : extract(data, propertyName);
    };
}

/**
 * Extract a boolean from the given Json object.
 * If the value is not a boolean, an error is thrown.
 *
 * @param data - the object to extract the value from
 * @param propertyName - the name of the parameter to extract
 * @returns the extracted value
 */
export function extractBoolean(data: Json, propertyName: string): boolean {
    const record = assertRecord(data, "data");
    return assertBoolean(record[propertyName], propertyName);
}

/**
 * Extract a string from the given Json object.
 * If the value is not a string, an error is thrown.
 *
 * @param data - the object to extract the value from
 * @param propertyName - the name of the parameter to extract
 * @returns the extracted value
 */
export function extractString(data: Json, propertyName: string): string {
    const record = assertRecord(data, "data");
    return assertString(record[propertyName], propertyName);
}

export const extractNullOrString = nullOrExtract(extractString);

/**
 * Extract a number from the given Json object.
 * If the value is not a number, an error is thrown.
 *
 * @param data - the object to extract the value from
 * @param propertyName - the name of the parameter to extract
 * @returns the extracted value
 */
export function extractNumber(data: Json, propertyName: string): number {
    const record = assertRecord(data, "data");
    return assertNumber(record[propertyName], propertyName);
}

export const extractNullOrNumber = nullOrExtract(extractNumber);

/**
 * Extract a Date from the given Json object.
 * If the value is not a valid Date, an error is thrown.
 *
 * @param data - the object to extract the value from
 * @param propertyName - the name of the parameter to extract
 * @returns the extracted value
 */
export function extractDate(data: Json, propertyName: string): Date {
    const dateString = extractString(data, propertyName);
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
        throw new Error(`Invalid date for ${dateString}`);
    }

    return d;
}

export const extractNullOrDate: (data: Json, propertyName: string) => Date | null = nullOrExtract(extractDate);

/**
 * Extract an Array from the given Json object.
 * If the value is not a valid Array, an error is thrown.
 *
 * @param data - the object to extract the value from
 * @param propertyName - the name of the parameter to extract
 * @returns the extracted value
 **/
export function extractArrayOfJson(data: Json, propertyName: string): Array<Json> {
    const record = assertRecord(data, "data");
    return assertArray(record[propertyName], propertyName) as Array<Json>;
}

/**
 * Extract an Array from the given Json object and run the provided
 * transformer on all of the provided values.
 * If the value is not a valid Array, an error is thrown.
 *
 * @param data - the object to extract the value from
 * @param propertyName - the name of the parameter to extract
 * @param transformer - A function to transform all the Json elements extracted from the parameter
 * @returns the extracted value
 **/
export function extractArray<T>(data: Json, propertyName: string, transformer: Transformer<T>): Array<T> {
    return extractArrayOfJson(data, propertyName).map((value) => transformer(value));
}

/**
 * Extract a Json object from the given Json object.
 * If the value is not a valid Json object, an error is thrown.
 *
 * Note, if the extracted value is undefined, null will be returned
 * since the extractor functions don't distinguish an undefined value
 * and a null value.
 *
 * @param data - the object to extract the value from
 * @param propertyName - the name of the parameter to extract
 * @returns the extracted value
 */
export function extractJson(data: Json, propertyName: string): Json {
    const record = assertRecord(data, "data") as Record<string, Json>;

    const value = record[propertyName];
    return value === undefined ? null : value;
}

/**
 * Extract a Json object from the given Json object and transform
 * that value using the given transformer function.
 * If the provided json object is not a valid Json object, an error is thrown.
 *
 * Note, if the extracted value is undefined, null will be returned
 * since the extractor functions don't distinguish an undefined value
 * and a null value.
 *
 * @param data - the object to extract the value from
 * @param propertyName - the name of the parameter to extract
 * @param transformer - A function to transform the extracted value
 * @returns the extracted and transformed value
 **/
export function extractJsonWithTransform<T>(data: Json, propertyName: string, transformer: Transformer<T>): T {
    return transformer(extractJson(data, propertyName));
}
