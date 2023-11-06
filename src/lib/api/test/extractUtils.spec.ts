import {
    extractArray,
    extractArrayOfJson,
    extractBoolean,
    extractDate,
    extractJson,
    extractJsonWithTransform,
    extractNullOrDate,
    extractNullOrString,
    extractNumber,
    Extractor,
    extractString,
    nullOrTransform,
    Transformer,
} from "../extractUtils";
import assert from "@whereby/jslib-media/src/utils/assert";
import { Json } from "../Response";
import { assertString } from "../parameterAssertUtils";
type User = { name: string; eyeColor: string | null; age: number; dob: Date };
function toUser(data: Json): User {
    return {
        name: extractString(data, "name"),
        eyeColor: extractNullOrString(data, "eyeColor"),
        age: extractNumber(data, "age"),
        dob: extractDate(data, "dob"),
    };
}

type InvalidValue = { desc: string; value?: Json; expectedError?: string | RegExp };
type ValidValue = { desc: string; value?: Json; expected: unknown };
function itShouldThrowForValues(extract: Extractor<unknown>, values: ReadonlyArray<InvalidValue>) {
    assert.ok(typeof extract === "function", "extract must be a function");

    values.forEach(({ desc, value, expectedError }) => {
        it(`should throw for ${desc}`, () => {
            expect(() => {
                extract({ ...(value !== undefined && { prop: value }) }, "prop");
            }).toThrowError(expectedError || /prop<.*> is required/);
        });
    });
}

function itShouldExtractForValues(extract: Extractor<unknown>, values: ReadonlyArray<ValidValue>) {
    values.forEach(({ desc, value, expected }) => {
        it(`should extract ${desc} correctly`, () => {
            const result = extract({ ...(value !== undefined && { prop: value }) }, "prop");

            expect(result).toEqual(expected);
        });
    });
}

function testExtract(
    extract: Extractor<unknown>,
    {
        invalidValues,
        validValues,
    }: { invalidValues: ReadonlyArray<InvalidValue>; validValues: ReadonlyArray<ValidValue> }
) {
    itShouldThrowForValues(extract, invalidValues);
    itShouldExtractForValues(extract, validValues);
    [null, undefined, "string", 12].forEach((value) => {
        it(`should throw for ${value}`, () => {
            expect(() => {
                //@ts-expect-error
                extract(value, "prop");
            }).toThrowError(/prop<.*> is required|data must be a record/);
        });
    });
}

describe("extractUtils", () => {
    const nullValues: Array<ValidValue> = [
        { desc: "null", value: null, expected: null },
        { desc: "null", value: undefined, expected: null },
    ];
    const invalidNullValues: Array<InvalidValue> = [
        { desc: "null", value: null },
        { desc: "null", value: undefined },
    ];
    const validStringValues: ReadonlyArray<ValidValue> = [
        { desc: "string", value: "some-string", expected: "some-string" },
    ];
    const invalidStringValues: ReadonlyArray<InvalidValue> = [
        { desc: "boolean", value: true },
        { desc: "number", value: 12 },
        { desc: "empty object", value: {} },
        { desc: "empty array", value: [] },
    ];

    describe("extractBoolean", () => {
        testExtract(extractBoolean, {
            validValues: [
                { desc: "boolean - true", value: true, expected: true },
                { desc: "boolean - false", value: false, expected: false },
            ],
            invalidValues: (
                [
                    { desc: "number", value: 0 },
                    { desc: "string", value: "some-string" },
                    { desc: "string - true", value: "true" },
                    { desc: "string - false", value: "false" },
                    { desc: "empty object", value: {} },
                    { desc: "empty array", value: [] },
                ] as Array<InvalidValue>
            ).concat(invalidNullValues),
        });
    });

    describe("extractString", () => {
        testExtract(extractString, {
            validValues: validStringValues,
            invalidValues: invalidStringValues.concat(nullValues),
        });
    });

    describe("extractNullOrString", () => {
        testExtract(extractNullOrString, {
            validValues: validStringValues.concat(nullValues),
            invalidValues: invalidStringValues,
        });
    });

    describe("extractNumber", () => {
        testExtract(extractNumber, {
            validValues: [{ desc: "number", value: 12, expected: 12 }],
            invalidValues: invalidNullValues.concat([
                { desc: "boolean", value: true },
                { desc: "string", value: "some-string" },
                { desc: "empty object", value: {} },
                { desc: "empty array", value: [] },
            ]),
        });
    });

    const validDate = new Date("2022-01-01");
    const validDateValues: Array<ValidValue> = [{ desc: "date", value: validDate.toISOString(), expected: validDate }];
    const invalidDateValues: Array<InvalidValue> = [
        { desc: "boolean", value: true },
        { desc: "number", value: 12 },
        { desc: "invalid date string", value: "some-string", expectedError: "Invalid date for some-string" },
        { desc: "empty object", value: {} },
        { desc: "empty array", value: [] },
    ];
    describe("extractDate", () => {
        testExtract(extractDate, {
            validValues: validDateValues,
            invalidValues: invalidNullValues.concat(invalidDateValues),
        });
    });

    describe("extractNullOrDate", () => {
        testExtract(extractNullOrDate, {
            validValues: validDateValues.concat(nullValues),
            invalidValues: invalidDateValues,
        });
    });

    const invalidArrayValues: ReadonlyArray<InvalidValue> = [
        { desc: "boolean", value: true },
        { desc: "number", value: 12 },
        { desc: "string", value: "some-string" },
        { desc: "empty object", value: {} },
    ];

    describe("extractArrayOfJson", () => {
        testExtract(extractArrayOfJson, {
            validValues: [
                { desc: "empty array", value: [], expected: [] },
                { desc: "array with multiple elements", value: ["1", 2, true, {}], expected: ["1", 2, true, {}] },
            ],
            invalidValues: invalidArrayValues.concat(nullValues),
        });
    });

    describe("extractArray", () => {
        const invalidArrayValuesWithNullValues: ReadonlyArray<InvalidValue> = invalidArrayValues.concat(nullValues);
        describe("with Identity transformer", () => {
            testExtract((data, propertyName) => extractArray(data, propertyName, (json) => json), {
                validValues: [
                    { desc: "empty array", value: [], expected: [] },
                    { desc: "array with multiple elements", value: ["1", 2, true, {}], expected: ["1", 2, true, {}] },
                ],
                invalidValues: invalidArrayValuesWithNullValues,
            });
        });

        describe("with string transformer", () => {
            const invalidArrayStringValues: ReadonlyArray<InvalidValue> = [
                {
                    desc: "array with number",
                    value: [12],
                    expectedError: "json<string> is required",
                },
                {
                    desc: "array with object",
                    value: [{}],
                    expectedError: "json<string> is required",
                },
            ];
            testExtract(
                (data, propertyName) => extractArray(data, propertyName, (json) => assertString(json, "json")),
                {
                    validValues: [
                        { desc: "empty array", value: [], expected: [] },
                        { desc: "empty array", value: ["some-id"], expected: ["some-id"] },
                    ],
                    invalidValues: invalidArrayStringValues.concat(invalidArrayValuesWithNullValues),
                }
            );
        });

        describe("with complex object transformer", () => {
            const dob = new Date("1965-01-01");
            const invalidUserArray: ReadonlyArray<InvalidValue> = [
                {
                    desc: "array with invalid user object",
                    value: [{}],
                    expectedError: "name<string> is required",
                },
                {
                    desc: "array with string",
                    value: ["string"] as Json,
                    expectedError: "data must be a record.",
                },
            ];
            testExtract((data, propertyName) => extractArray(data, propertyName, toUser), {
                validValues: [
                    {
                        desc: "only required",
                        value: [
                            { name: "some-name", age: 13, dob: dob.toISOString() },
                            { name: "some-other-name", eyeColor: "brown", age: 40, dob: dob.toISOString() },
                        ],
                        expected: [
                            { name: "some-name", age: 13, dob, eyeColor: null },
                            { name: "some-other-name", eyeColor: "brown", age: 40, dob },
                        ],
                    },
                    {
                        desc: "empty array",
                        value: [],
                        expected: [],
                    },
                ],
                invalidValues: invalidUserArray.concat(invalidArrayValuesWithNullValues),
            });
        });
    });

    const validJsonValues = nullValues.concat([
        { desc: "empty object", value: {}, expected: {} },
        {
            desc: "object with multiple elements",
            value: { string: "1", number: 2, boolean: true, object: {}, array: [] },
            expected: { string: "1", number: 2, boolean: true, object: {}, array: [] },
        },
        { desc: "boolean", value: true, expected: true },
        { desc: "number", value: 12, expected: 12 },
        { desc: "string", value: "some-string", expected: "some-string" },
        { desc: "empty array", value: [], expected: [] },
    ]);
    const invalidJsonValues: Array<InvalidValue> = [];
    describe("extractJson", () => {
        testExtract(extractJson, {
            validValues: validJsonValues,
            invalidValues: invalidJsonValues,
        });
    });

    describe("extractJsonWithTransform", () => {
        describe("with Identity transformer", () => {
            testExtract((data, propertyName) => extractJsonWithTransform(data, propertyName, (json) => json), {
                validValues: validJsonValues,
                invalidValues: invalidJsonValues,
            });
        });

        describe("with string transformer", () => {
            testExtract(
                (data, propertyName) =>
                    extractJsonWithTransform(data, propertyName, (json) => extractString(json, "field")),
                {
                    validValues: [{ desc: "string field", value: { field: "some-field" }, expected: "some-field" }],
                    invalidValues: [
                        { desc: "boolean field", value: { field: true }, expectedError: "field<string> is required" },
                        { desc: "null field", value: { field: null }, expectedError: "field<string> is required" },
                    ],
                }
            );
        });

        describe("with complex object transformer", () => {
            const dob = new Date("1965-01-01");
            testExtract((data, propertyName) => extractJsonWithTransform(data, propertyName, toUser), {
                validValues: [
                    {
                        desc: "only required",
                        value: { name: "some-name", age: 13, dob: dob.toISOString() },
                        expected: { name: "some-name", age: 13, dob, eyeColor: null },
                    },
                    {
                        desc: "all properties",
                        value: { name: "some-name", eyeColor: "brown", age: 40, dob: dob.toISOString() },
                        expected: { name: "some-name", eyeColor: "brown", age: 40, dob },
                    },
                ],
                invalidValues: [
                    {
                        desc: "empty object",
                        value: {} as Json,
                        expectedError: "name<string> is required",
                    },
                    {
                        desc: "object without all fields",
                        value: { name: "some name" } as Json,
                        expectedError: "age<number> is required",
                    },
                ],
            });
        });
    });

    describe("nullOrTransform", () => {
        const intToString: Transformer<string> = (int: Json) => {
            if (typeof int !== "number") {
                throw new Error("unexpected type");
            }

            return int.toString();
        };

        const nullOrIntToString = nullOrTransform(intToString);

        it("should return null if value is null", () => {
            const value = nullOrIntToString(null);

            expect(value).toEqual(null);
        });

        it("should return null if value is undefined", () => {
            //@ts-expect-error
            const value = nullOrIntToString(undefined);

            expect(value).toEqual(null);
        });

        it(
            "should return whatever value returned by the transformer if not null",
            () => {
                const value = nullOrIntToString(12);

                expect(value).toEqual("12");
            }
        );
    });
});
