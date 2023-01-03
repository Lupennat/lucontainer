/* eslint-disable @typescript-eslint/no-unused-vars */

import { ReflectionParameter } from '../../types';
import {
    arrayWrap,
    getParameterClass,
    getParametersDefinition,
    isFunctionConstructor,
    unwrapIfClosure
} from '../../utils';

const variable = '[testVar]';

class Dummy {}

class Test {
    public async async(a: string): Promise<void> {}
    public async *asyncGenerator(a: string): AsyncGenerator<void> {}
    public *generator(a: string): Generator<void> {}

    constructor(a: string, b: string) {}

    [variable](a: string): void {}
    [Symbol.for('[test]')](a: string): void {}
    public static test(a: string): void {}
    public test(a: string): void {}
}

function TestFn(a: string, b: string): void {}
TestFn.test = function (a: string): void {};
TestFn.prototype.async = async function (a: string): Promise<void> {};
TestFn.prototype.asyncGenerator = async function* (a: string): AsyncGenerator<void> {};
TestFn.prototype.generator = function* (a: string): Generator<void> {};
TestFn.prototype[variable] = function (a: string): void {};
TestFn.prototype[Symbol.for('[test]')] = function (a: string): void {};
TestFn.prototype.test = function (a: string): void {};

const FnVar = function (a: string, b: string): void {};
FnVar.prototype.test = function (a: string): void {};

describe('Util', () => {
    it('Works Is Function Constructor', () => {
        expect(isFunctionConstructor(Array)).toBeTruthy();
        expect(isFunctionConstructor(String)).toBeTruthy();
        expect(isFunctionConstructor(Number)).toBeTruthy();
        expect(isFunctionConstructor(Object)).toBeTruthy();
        expect(isFunctionConstructor(Date)).toBeTruthy();
        expect(isFunctionConstructor(Symbol)).toBeTruthy();
        expect(isFunctionConstructor(BigInt)).toBeTruthy();
        expect(isFunctionConstructor(class Test {})).toBeTruthy();
        expect(isFunctionConstructor(function test() {})).toBeTruthy();
        const testFN = function (): void {};
        expect(isFunctionConstructor(testFN)).toBeTruthy();
        const testArrow = (): void => {};
        expect(isFunctionConstructor(testArrow)).toBeFalsy();
        expect(isFunctionConstructor(function () {})).toBeFalsy();
        expect(isFunctionConstructor(() => {})).toBeFalsy();
    });

    it('Works Unwrap If Closure', () => {
        expect(unwrapIfClosure('foo')).toBe('foo');
        expect(
            unwrapIfClosure(function () {
                return 'foo';
            })
        ).toBe('foo');
        expect(
            unwrapIfClosure(() => {
                return 'foo';
            })
        ).toBe('foo');

        const test2 = (): string => {
            return 'foo';
        };

        expect(unwrapIfClosure(test2)).toBe('foo');

        // function can be newable is not a closure
        function testFN(): string {
            return 'foo';
        }

        expect(unwrapIfClosure(testFN)).toEqual(testFN);

        // function can be newable is not a closure
        const test = function (): string {
            return 'foo';
        };

        expect(unwrapIfClosure(test)).toEqual(test);

        // class is not a closure
        class Test {}

        expect(unwrapIfClosure(Test)).toEqual(Test);
    });

    it('Works Array Wrap', () => {
        const str = 'a';
        const array = ['a'];
        let obj = new (class {
            value = 'a';
        })();

        expect(arrayWrap(str)).toEqual(['a']);
        expect(arrayWrap(array)).toEqual(array);
        expect(arrayWrap(obj)).toEqual([obj]);
        expect(arrayWrap(null)).toEqual([]);
        expect(arrayWrap(undefined)).toEqual([]);
        expect(arrayWrap([null])).toEqual([null]);
        expect(arrayWrap([undefined])).toEqual([undefined]);
        expect(arrayWrap([null, null])).toEqual([null, null]);
        expect(arrayWrap([undefined, undefined])).toEqual([undefined, undefined]);
        expect(arrayWrap('')).toEqual(['']);
        expect(arrayWrap([''])).toEqual(['']);
        expect(arrayWrap(false)).toEqual([false]);
        expect(arrayWrap([false])).toEqual([false]);
        expect(arrayWrap(0)).toEqual([0]);
        expect(arrayWrap([0])).toEqual([0]);

        obj = JSON.parse(JSON.stringify(obj));
        expect(arrayWrap(obj)).toEqual([obj]);
        expect(arrayWrap(obj)[0]).toEqual(obj);
    });

    it('Works Get Parameter Class', () => {
        const parameter: ReflectionParameter = {
            className: 'Test',
            name: 'test',
            isVariadic: false,
            allowsNull: false,
            hasDefault: false,
            rawDefaultValue: null,
            index: 0
        };
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = null;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Array;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Object;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Function;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Boolean;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Symbol;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Error;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = EvalError;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = RangeError;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = ReferenceError;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = SyntaxError;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = TypeError;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = URIError;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Number;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = BigInt;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Math;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Date;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = String;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = RegExp;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Array;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Int8Array;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Uint8Array;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Uint8ClampedArray;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Int16Array;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Uint16Array;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Int32Array;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Uint32Array;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Float32Array;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Float64Array;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = BigInt64Array;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = BigUint64Array;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Map;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Set;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = WeakMap;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = WeakSet;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = ArrayBuffer;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = SharedArrayBuffer;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Atomics;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = DataView;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = JSON;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Promise;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Reflect;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Proxy;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Intl;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Intl.Collator;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Intl.DateTimeFormat;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Intl.NumberFormat;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Intl.PluralRules;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Intl.RelativeTimeFormat;
        expect(getParameterClass(parameter)).toBeNull();
        parameter.type = Intl.Locale;
        expect(getParameterClass(parameter)).toBeNull();

        parameter.type = 'Interface';
        expect(getParameterClass(parameter)).toBe('Interface');

        class Test {}
        parameter.type = Test;
        expect(getParameterClass(parameter)).toEqual(Test);
    });

    it('Works Get Parameters Definition Can Define Parameters From Constructor', () => {
        let params = getParametersDefinition(Test, 'Test', true);

        expect(params.length).toBe(2);
        expect(params[0].name).toBe('a');
        expect(params[0].index).toBe(0);

        params = getParametersDefinition(Dummy, 'Dummy', true);
        expect(params.length).toBe(0);

        params = getParametersDefinition(
            class {
                constructor(a: any, b: any) {}
            },
            '',
            true
        );

        expect(params.length).toBe(2);
        expect(params[1].name).toBe('b');
        expect(params[1].index).toBe(1);

        params = getParametersDefinition(class {}, '', true);
        expect(params.length).toBe(0);

        // should works also with function prototyped
        params = getParametersDefinition(TestFn, 'TestFn', true);

        expect(params.length).toBe(2);
        expect(params[0].name).toBe('a');
        expect(params[0].index).toBe(0);

        params = getParametersDefinition(FnVar, 'FnVar', true);

        expect(params.length).toBe(2);
        expect(params[0].name).toBe('a');
        expect(params[0].index).toBe(0);
    });

    it('Get Parameters Definition Can Define Parameters From Static Method', () => {
        let params = getParametersDefinition(Test.test, 'Test');
        expect(params.length).toBe(1);
        expect(params[0].name).toBe('a');
        expect(params[0].index).toBe(0);

        params = getParametersDefinition(TestFn.test, 'TestFn');
        expect(params.length).toBe(1);
        expect(params[0].name).toBe('a');
        expect(params[0].index).toBe(0);
    });

    it('Get Parameters Definition Can Define Parameters From Prototype Method', () => {
        let params = getParametersDefinition(Test.prototype.test, 'Test');
        expect(params.length).toBe(1);
        expect(params[0].name).toBe('a');
        expect(params[0].index).toBe(0);

        params = getParametersDefinition(TestFn.prototype.test, 'TestFn');
        expect(params.length).toBe(1);
        expect(params[0].name).toBe('a');
        expect(params[0].index).toBe(0);
    });

    it('Get Parameters Definition Can Define Parameters From Variable Named Method', () => {
        let params = getParametersDefinition(Test.prototype[variable], 'Test');
        expect(params.length).toBe(1);
        expect(params[0].name).toBe('a');
        expect(params[0].index).toBe(0);

        params = getParametersDefinition(TestFn.prototype[variable], 'TestFn');
        expect(params.length).toBe(1);
        expect(params[0].name).toBe('a');
        expect(params[0].index).toBe(0);
    });

    it('Get Parameters Definition Can Define Parameters From Variable Symbol Method', () => {
        let params = getParametersDefinition((Test.prototype as any)[Symbol.for('[test]')], 'Test');
        expect(params.length).toBe(1);
        expect(params[0].name).toBe('a');
        expect(params[0].index).toBe(0);
        params = getParametersDefinition(TestFn.prototype[Symbol.for('[test]')], 'TestFn');
        expect(params.length).toBe(1);
        expect(params[0].name).toBe('a');
        expect(params[0].index).toBe(0);
    });

    it('Get Parameters Definition Can Define Parameters From Function', () => {
        let params = getParametersDefinition(function (a: any, b: any, c: any) {});
        expect(params.length).toBe(3);
        expect(params[0].name).toBe('a');
        expect(params[1].name).toBe('b');
        expect(params[2].name).toBe('c');

        params = getParametersDefinition(function test(a: any, b: any, c: any) {});
        expect(params.length).toBe(3);
        expect(params[0].name).toBe('a');
        expect(params[1].name).toBe('b');
        expect(params[2].name).toBe('c');

        params = getParametersDefinition((a: any, b: any, ...c: any[]) => {});
        expect(params.length).toBe(3);
        expect(params[0].name).toBe('a');
        expect(params[1].name).toBe('b');
        expect(params[2].name).toBe('c');
    });

    it('Get Parameters Definition Can Define Parameters From Async Function Or Method', () => {
        let params = getParametersDefinition(async function (a: any, b: any, c: any) {});
        expect(params.length).toBe(3);
        expect(params[0].name).toBe('a');
        expect(params[1].name).toBe('b');
        expect(params[2].name).toBe('c');

        params = getParametersDefinition(Test.prototype.async);
        expect(params.length).toBe(1);
        expect(params[0].name).toBe('a');

        params = getParametersDefinition(TestFn.prototype.async);
        expect(params.length).toBe(1);
        expect(params[0].name).toBe('a');
    });

    it('Get Parameters Definition Can Define Parameters From Generator Function Or Method', () => {
        let params = getParametersDefinition(function* (a: any, b: any, c: any) {});
        expect(params.length).toBe(3);
        expect(params[0].name).toBe('a');
        expect(params[1].name).toBe('b');
        expect(params[2].name).toBe('c');

        params = getParametersDefinition(Test.prototype.generator);
        expect(params.length).toBe(1);
        expect(params[0].name).toBe('a');

        params = getParametersDefinition(TestFn.prototype.generator);
        expect(params.length).toBe(1);
        expect(params[0].name).toBe('a');
    });

    it('Get Parameters Definition Can Define Parameters From Async Generator Function Or Method', () => {
        let params = getParametersDefinition(async function* (a: any, b: any, c: any) {});
        expect(params.length).toBe(3);
        expect(params[0].name).toBe('a');
        expect(params[1].name).toBe('b');
        expect(params[2].name).toBe('c');

        params = getParametersDefinition(Test.prototype.asyncGenerator);
        expect(params.length).toBe(1);
        expect(params[0].name).toBe('a');

        params = getParametersDefinition(TestFn.prototype.asyncGenerator);
        expect(params.length).toBe(1);
        expect(params[0].name).toBe('a');
    });

    it('Get Parameters Definition Can Define Parameters Name', () => {
        const params = getParametersDefinition(
            (a: string, b = '', { pretty }: { pretty: boolean } = { pretty: false }) => {}
        );

        expect(params[0].name).toBe('a');
        expect(params[1].name).toBe('b');
        expect(params[2].name).toBe('[Destructured]');
    });

    it('Get Parameters Definition Can Define Parameters Index', () => {
        const params = getParametersDefinition(
            (a: string, b = '', { pretty }: { pretty: boolean } = { pretty: false }) => {}
        );

        expect(params[0].index).toBe(0);
        expect(params[1].index).toBe(1);
        expect(params[2].index).toBe(2);
    });

    it('Get Parameters Definition Can Define Parameters Has Default', () => {
        const params = getParametersDefinition(
            (a: string, b = '', { pretty }: { pretty: boolean } = { pretty: false }) => {}
        );

        expect(params[0].hasDefault).toBeFalsy();
        expect(params[1].hasDefault).toBeTruthy();
        expect(params[2].hasDefault).toBeTruthy();
    });

    it('Get Parameters Definition Can Define Parameters Raw Default Values Literal Or Array|Object Expression When Empty', () => {
        const params = getParametersDefinition(
            (
                a = 'a',
                b = 1,
                c: string[] = [],
                d: any = {},
                e: string[] = ['a', 'v', 'c'],
                { pretty }: { pretty: boolean } = { pretty: false }
            ) => {}
        );

        expect(params[0].rawDefaultValue).toBe('a');
        expect(params[1].rawDefaultValue).toBe(1);
        expect(params[2].rawDefaultValue).toEqual([]);
        expect(params[3].rawDefaultValue).toEqual({});
        expect(params[4].rawDefaultValue).toBeUndefined();
        expect(params[5].rawDefaultValue).toBeUndefined();
    });

    it('Get Parameters Definition Can Define Parameters Allows Null On Default Null Or Undefined', () => {
        const params = getParametersDefinition(
            (a: string, b: any | null = null, c: string | undefined = undefined) => {}
        );
        expect(params[0].allowsNull).toBeFalsy();
        expect(params[1].allowsNull).toBeTruthy();
        expect(params[2].allowsNull).toBeTruthy();
    });

    it('Get Parameters Definition Can Define Is Variadic', () => {
        const params = getParametersDefinition((a: string, ...b: string[]) => {});
        expect(params[0].isVariadic).toBeFalsy();
        expect(params[1].isVariadic).toBeTruthy();
    });

    it('Get Parameters Definition Can Define Destructured Parameters', () => {
        let params = getParametersDefinition(({ pretty }: { pretty: boolean } = { pretty: false }) => {});
        expect(params[0].name).toBe('[Destructured]');
        expect(params[0].index).toBe(0);
        expect(params[0].isVariadic).toBeFalsy();
        expect(params[0].allowsNull).toBeFalsy();
        expect(params[0].rawDefaultValue).toBeUndefined();
        expect(params[0].hasDefault).toBeTruthy();

        params = getParametersDefinition(({ pretty }: { pretty: boolean }) => {});
        expect(params[0].name).toBe('[Destructured]');
        expect(params[0].index).toBe(0);
        expect(params[0].isVariadic).toBeFalsy();
        expect(params[0].allowsNull).toBeFalsy();
        expect(params[0].rawDefaultValue).toBeUndefined();
        expect(params[0].hasDefault).toBeFalsy();
    });

    it('Get Parameters Definition Can Define Number and String Literal Type', () => {
        let params = getParametersDefinition((a = String('text')) => {});
        expect(params[0].type).toEqual(undefined);
        params = getParametersDefinition((a = new String('text')) => {});
        expect(params[0].type).toEqual(undefined);
        params = getParametersDefinition((a = 'text') => {});
        expect(params[0].type).toEqual(String);
        params = getParametersDefinition((a = Number(10)) => {});
        expect(params[0].type).toEqual(undefined);
        params = getParametersDefinition((a = new Number(10)) => {});
        expect(params[0].type).toEqual(undefined);
        params = getParametersDefinition((a = 10) => {});
        expect(params[0].type).toEqual(Number);
    });
});
