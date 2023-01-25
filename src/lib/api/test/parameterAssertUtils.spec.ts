import assert from "assert";
import {
    assertBoolean,
    assertRoomName,
    assertNumber,
    assertString,
    assertInstanceOf,
    assertOneOf,
    assertRecord,
} from "../parameterAssertUtils";

function forEachObject(object: Record<string, unknown>, func: (value: unknown, key: string) => void) {
    Object.keys(object).forEach((key) => func(object[key], key));
}
describe("parameterAssertUtils", () => {
    function itShouldThrowForValues(testValues: Record<string, unknown>, test: (desc: string, value: unknown) => void) {
        assert.ok(typeof test === "function", "test must be a function");

        forEachObject(testValues, (value, descriptionOfValue) => {
            it(`should throw for ${descriptionOfValue}`, () => {
                test(descriptionOfValue, value);
            });
        });
    }

    describe("assertBoolean", () => {
        itShouldThrowForValues(
            {
                string: "aaa",
                "number as string": "12",
                "boolean as string": "true",
                null: null,
                undefined: undefined, // eslint-disable-line object-shorthand
                Object: {},
            },
            (description: string, value: unknown) => {
                expect(() => {
                    assertBoolean(value, description);
                }).toThrowError(`${description}<boolean> is required`);
            }
        );

        it("should return provided value if false", () => {
            const value = assertBoolean(false, "false value");

            expect(value).toBe(false);
        });

        it("should return provided value if true", () => {
            const value = assertBoolean(true, "true value");

            expect(value).toBe(true);
        });
    });

    describe("assertNumber", () => {
        itShouldThrowForValues(
            {
                string: "aaa",
                "number as string": "12",
                boolean: true,
                null: null,
                undefined: undefined, // eslint-disable-line object-shorthand
                Object: {},
            },
            (description, value) => {
                expect(() => {
                    assertNumber(value, description);
                }).toThrowError(`${description}<number> is required`);
            }
        );

        it("should return provided number", () => {
            const someNumber = 12;

            const actualValue = assertNumber(12, "some number");

            expect(actualValue).toBe(someNumber);
        });
    });

    describe("assertString", () => {
        itShouldThrowForValues(
            {
                number: 1,
                boolean: true,
                null: null,
                undefined: undefined, // eslint-disable-line object-shorthand
                Object: {},
            },
            (description, value) => {
                expect(() => {
                    assertString(value, description);
                }).toThrowError(`${description}<string> is required`);
            }
        );

        it("should return provided value if string", () => {
            const someString = "some-string";

            const actualValue = assertString(someString, "parameter name");

            expect(actualValue).toBe(someString);
        });
    });

    describe("assertRoomName", () => {
        itShouldThrowForValues(
            {
                number: 1,
                boolean: true,
                null: null,
                undefined: undefined, // eslint-disable-line object-shorthand
                Object: {},
            },
            (description, value) => {
                expect(() => {
                    assertRoomName(value, description);
                }).toThrowError(`${description}<string> is required`);
            }
        );

        it("should throw error if roomName is not prefixed with slash", () => {
            expect(() => assertRoomName("not-prefixed")).toThrowError("roomName must begin with a '/'");
        });

        it("should return roomName if roomName is prefixed with slash", () => {
            const prefixedRoomName = "/some-prefix";

            const actualValue = assertRoomName(prefixedRoomName);

            expect(actualValue).toBe(prefixedRoomName);
        });
    });

    describe("assertInstanceOf", () => {
        class SomeOtherClass {
            _param: number;
            constructor(param: number) {
                this._param = param;
            }
        }

        class SomeClass {
            _param: string;
            constructor(param: string) {
                this._param = param;
            }
        }

        class SubSomeClass extends SomeClass {}

        forEachObject(
            {
                number: 1,
                boolean: true,
                null: null,
                undefined: undefined, // eslint-disable-line object-shorthand
                Object: {},
                someOtherClass: new SomeOtherClass(1212),
            },
            (value, description) => {
                it(`should throw if ${description} is not instanceof SomeClass`, () => {
                    expect(() => {
                        assertInstanceOf(value, SomeClass, "someClass");
                    }).toThrowError("someClass<SomeClass> is required");
                });
            }
        );

        it("should throw with provided parameterName", () => {
            expect(() => {
                assertInstanceOf(null, SomeClass, "someParameterName");
            }).toThrowError("someParameterName<SomeClass> is required");
        });

        it(
            "should throw with parameterName = type (except that first character is lower-case) if none is provided",
            () => {
                expect(() => {
                    assertInstanceOf(null, SomeClass);
                }).toThrowError("someClass<SomeClass> is required");
            }
        );

        it("should return value if instance of class", () => {
            const instance = new SomeClass("some value");

            const actualValue = assertInstanceOf(instance, SomeClass);

            expect(actualValue).toBe(instance);
        });

        it("should return value if instance of subclass", () => {
            const instance = new SubSomeClass("some value");

            const actualValue = assertInstanceOf(instance, SomeClass);

            expect(actualValue).toBe(instance);
        });
    });

    describe("assertOneOf", () => {
        const description = "testValue";
        const allowedValues = ["hi", "welcome"];

        it("should throw if no value is provided", () => {
            expect(() => {
                assertOneOf(undefined, allowedValues, description);
            }).toThrowError(`value is required`);
        });

        it("should throw if allowed values is not an array", () => {
            expect(() => {
                // @ts-expect-error
                assertOneOf("hi", true, description);
            }).toThrowError(`allowedValues<array> is required`);
        });

        it("should throw if provided value is not allowed value", () => {
            expect(() => {
                assertOneOf("hello", allowedValues, description);
            }).toThrowError(
                `${description}<string> must be one of the following: ${allowedValues.join(", ")}`
            );
        });

        it("should return value if it is allowed", () => {
            const value = allowedValues[0];

            expect(assertOneOf(value, allowedValues, description)).toBe(value);
        });
    });

    describe("assertRecord", () => {
        itShouldThrowForValues(
            {
                string: "aaa",
                "number as string": "12",
                "boolean as string": "true",
                null: null,
                undefined: undefined, // eslint-disable-line object-shorthand
                Array: [],
            },
            (description, value) => {
                expect(() => {
                    assertRecord(value, description);
                }).toThrowError(`${description} must be a record`);
            }
        );

        it("should return provided value if {}", () => {
            const value = assertRecord({}, "emptyValue");

            expect(value).toEqual({});
        });

        it("should return provided value if contains some fields", () => {
            const o = { field: 1 };
            const value = assertRecord(o, "emptyValue");

            expect(value).toEqual(o);
        });
    });
});
