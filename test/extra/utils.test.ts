import { expect } from 'chai';
import { ReflectionParameter } from '../../src/types';
import {
    arrayWrap,
    dontTrapProperty,
    getParameterClass,
    getParametersDefinition,
    isFunctionConstructor,
    unwrapIfClosure
} from '../../src/utils';

const variable = '[testVar]';

class Dummy {}

class Test {
    public async async(a: string) {}
    public async *asyncGenerator(a: string) {}
    public *generator(a: string) {}

    constructor(a: string, b: string) {}

    [variable](a: string) {}
    [Symbol.for('[test]')](a: string) {}
    public static test(a: string) {}
    public test(a: string) {}
}

function TestFn(a: string, b: string) {}
TestFn.test = function (a: string) {};
TestFn.prototype.async = async function (a: string) {};
TestFn.prototype.asyncGenerator = async function* (a: string) {};
TestFn.prototype.generator = function* (a: string) {};
TestFn.prototype[variable] = function (a: string) {};
TestFn.prototype[Symbol.for('[test]')] = function (a: string) {};
TestFn.prototype.test = function (a: string) {};

const FnVar = function (a: string, b: string) {};
FnVar.prototype.test = function (a: string) {};

describe('Util', () => {
    it('Works Is Function Constructor', () => {
        expect(isFunctionConstructor(Array)).to.be.true;
        expect(isFunctionConstructor(String)).to.be.true;
        expect(isFunctionConstructor(Number)).to.be.true;
        expect(isFunctionConstructor(Object)).to.be.true;
        expect(isFunctionConstructor(Date)).to.be.true;
        expect(isFunctionConstructor(Symbol)).to.be.true;
        expect(isFunctionConstructor(BigInt)).to.be.true;
        expect(isFunctionConstructor(class Test {})).to.be.true;
        expect(isFunctionConstructor(function test() {})).to.be.true;
        const testFN = function () {};
        expect(isFunctionConstructor(testFN)).to.be.true;
        const testArrow = () => {};
        expect(isFunctionConstructor(testArrow)).to.be.false;
        expect(isFunctionConstructor(function () {})).to.be.false;
        expect(isFunctionConstructor(() => {})).to.be.false;
    });

    it('Works Unwrap If Closure', () => {
        expect(unwrapIfClosure('foo')).to.eq('foo');
        expect(
            unwrapIfClosure(function () {
                return 'foo';
            })
        ).to.eq('foo');
        expect(
            unwrapIfClosure(() => {
                return 'foo';
            })
        ).to.eq('foo');

        const test2 = () => {
            return 'foo';
        };

        expect(unwrapIfClosure(test2)).to.eq('foo');

        // function can be newable is not a closure
        function testFN() {
            return 'foo';
        }

        expect(unwrapIfClosure(testFN)).to.eq(testFN);

        // function can be newable is not a closure
        const test = function () {
            return 'foo';
        };

        expect(unwrapIfClosure(test)).to.eq(test);

        // class is not a closure
        class Test {}

        expect(unwrapIfClosure(Test)).to.eq(Test);
    });

    it('Works Array Wrap', () => {
        const str = 'a';
        const array = ['a'];
        let obj = new (class {
            value = 'a';
        })();

        expect(arrayWrap(str)).to.eql(['a']);
        expect(arrayWrap(array)).to.eql(array);
        expect(arrayWrap(obj)).to.eql([obj]);
        expect(arrayWrap(null)).to.eql([]);
        expect(arrayWrap(undefined)).to.eql([]);
        expect(arrayWrap([null])).to.eql([null]);
        expect(arrayWrap([undefined])).to.eql([undefined]);
        expect(arrayWrap([null, null])).to.eql([null, null]);
        expect(arrayWrap([undefined, undefined])).to.eql([undefined, undefined]);
        expect(arrayWrap('')).to.eql(['']);
        expect(arrayWrap([''])).to.eql(['']);
        expect(arrayWrap(false)).to.eql([false]);
        expect(arrayWrap([false])).to.eql([false]);
        expect(arrayWrap(0)).to.eql([0]);
        expect(arrayWrap([0])).to.eql([0]);

        obj = JSON.parse(JSON.stringify(obj));
        expect(arrayWrap(obj)).to.eql([obj]);
        expect(arrayWrap(obj)[0]).to.eql(obj);
    });

    it('Works Dont Trap Property', () => {
        expect(dontTrapProperty(Symbol.for('ciao'))).to.be.true;
        expect(dontTrapProperty('then')).to.be.true;
        expect(dontTrapProperty('catch')).to.be.true;
        expect(dontTrapProperty('finally')).to.be.true;
        expect(dontTrapProperty('arguments')).to.be.true;
        expect(dontTrapProperty('prototype')).to.be.true;
        expect(dontTrapProperty('constructor')).to.be.true;
        expect(dontTrapProperty('toJSON')).to.be.true;
        expect(dontTrapProperty('#private')).to.be.true;
        expect(dontTrapProperty('regularProperty')).to.be.false;
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
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = null;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Array;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Object;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Function;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Boolean;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Symbol;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Error;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = EvalError;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = RangeError;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = ReferenceError;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = SyntaxError;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = TypeError;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = URIError;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Number;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = BigInt;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Math;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Date;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = String;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = RegExp;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Array;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Int8Array;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Uint8Array;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Uint8ClampedArray;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Int16Array;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Uint16Array;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Int32Array;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Uint32Array;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Float32Array;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Float64Array;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = BigInt64Array;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = BigUint64Array;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Map;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Set;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = WeakMap;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = WeakSet;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = ArrayBuffer;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = SharedArrayBuffer;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Atomics;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = DataView;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = JSON;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Promise;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Reflect;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Proxy;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Intl;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Intl.Collator;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Intl.DateTimeFormat;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Intl.NumberFormat;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Intl.PluralRules;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Intl.RelativeTimeFormat;
        expect(getParameterClass(parameter)).to.be.null;
        parameter.type = Intl.Locale;
        expect(getParameterClass(parameter)).to.be.null;

        parameter.type = 'Interface';
        expect(getParameterClass(parameter)).to.eq('Interface');

        class Test {}
        parameter.type = Test;
        expect(getParameterClass(parameter)).to.eq(Test);
    });

    it('Works Get Parameter Class With Circular Dependency', () => {
        // when inside circular dependency type become {}
        const parameter: ReflectionParameter = {
            className: 'Test',
            name: 'test',
            isVariadic: false,
            allowsNull: false,
            hasDefault: false,
            rawDefaultValue: null,
            index: 0,
            type: {}
        };

        expect(() => {
            getParameterClass(parameter);
        }).throw(
            'Unresolvable dependency resolving [[Parameter #0 [ <required> test ]] in class Test inside circular dependency.'
        );
    });

    it('Works Get Parameters Definition Can Define Parameters From Constructor', () => {
        let params = getParametersDefinition(Test, 'Test', true);

        expect(params.length).to.eq(2);
        expect(params[0].name).to.eq('a');
        expect(params[0].index).to.eq(0);

        params = getParametersDefinition(Dummy, 'Dummy', true);
        expect(params.length).to.eq(0);

        params = getParametersDefinition(
            class {
                constructor(a: any, b: any) {}
            },
            '',
            true
        );

        expect(params.length).to.eq(2);
        expect(params[1].name).to.eq('b');
        expect(params[1].index).to.eq(1);

        params = getParametersDefinition(class {}, '', true);
        expect(params.length).to.eq(0);

        // should works also with function prototyped
        params = getParametersDefinition(TestFn, 'TestFn', true);

        expect(params.length).to.eq(2);
        expect(params[0].name).to.eq('a');
        expect(params[0].index).to.eq(0);

        params = getParametersDefinition(FnVar, 'FnVar', true);

        expect(params.length).to.eq(2);
        expect(params[0].name).to.eq('a');
        expect(params[0].index).to.eq(0);
    });

    it('Get Parameters Definition Can Define Parameters From Static Method', () => {
        let params = getParametersDefinition(Test.test, 'Test');
        expect(params.length).to.eq(1);
        expect(params[0].name).to.eq('a');
        expect(params[0].index).to.eq(0);

        params = getParametersDefinition(TestFn.test, 'TestFn');
        expect(params.length).to.eq(1);
        expect(params[0].name).to.eq('a');
        expect(params[0].index).to.eq(0);
    });

    it('Get Parameters Definition Can Define Parameters From Prototype Method', () => {
        let params = getParametersDefinition(Test.prototype.test, 'Test');
        expect(params.length).to.eq(1);
        expect(params[0].name).to.eq('a');
        expect(params[0].index).to.eq(0);

        params = getParametersDefinition(TestFn.prototype.test, 'TestFn');
        expect(params.length).to.eq(1);
        expect(params[0].name).to.eq('a');
        expect(params[0].index).to.eq(0);
    });

    it('Get Parameters Definition Can Define Parameters From Variable Named Method', () => {
        let params = getParametersDefinition(Test.prototype[variable], 'Test');
        expect(params.length).to.eq(1);
        expect(params[0].name).to.eq('a');
        expect(params[0].index).to.eq(0);

        params = getParametersDefinition(TestFn.prototype[variable], 'TestFn');
        expect(params.length).to.eq(1);
        expect(params[0].name).to.eq('a');
        expect(params[0].index).to.eq(0);
    });

    it('Get Parameters Definition Can Define Parameters From Variable Symbol Method', () => {
        let params = getParametersDefinition((Test.prototype as any)[Symbol.for('[test]')], 'Test');
        expect(params.length).to.eq(1);
        expect(params[0].name).to.eq('a');
        expect(params[0].index).to.eq(0);
        params = getParametersDefinition(TestFn.prototype[Symbol.for('[test]')], 'TestFn');
        expect(params.length).to.eq(1);
        expect(params[0].name).to.eq('a');
        expect(params[0].index).to.eq(0);
    });

    it('Get Parameters Definition Can Define Parameters From Function', () => {
        let params = getParametersDefinition(function (a: any, b: any, c: any) {});
        expect(params.length).to.eq(3);
        expect(params[0].name).to.eq('a');
        expect(params[1].name).to.eq('b');
        expect(params[2].name).to.eq('c');

        params = getParametersDefinition(function test(a: any, b: any, c: any) {});
        expect(params.length).to.eq(3);
        expect(params[0].name).to.eq('a');
        expect(params[1].name).to.eq('b');
        expect(params[2].name).to.eq('c');

        params = getParametersDefinition((a: any, b: any, ...c: any[]) => {});
        expect(params.length).to.eq(3);
        expect(params[0].name).to.eq('a');
        expect(params[1].name).to.eq('b');
        expect(params[2].name).to.eq('c');
    });

    it('Get Parameters Definition Can Define Parameters From Async Function Or Method', () => {
        let params = getParametersDefinition(async function (a: any, b: any, c: any) {});
        expect(params.length).to.eq(3);
        expect(params[0].name).to.eq('a');
        expect(params[1].name).to.eq('b');
        expect(params[2].name).to.eq('c');

        params = getParametersDefinition(Test.prototype.async);
        expect(params.length).to.eq(1);
        expect(params[0].name).to.eq('a');

        params = getParametersDefinition(TestFn.prototype.async);
        expect(params.length).to.eq(1);
        expect(params[0].name).to.eq('a');
    });

    it('Get Parameters Definition Can Define Parameters From Generator Function Or Method', () => {
        let params = getParametersDefinition(function* (a: any, b: any, c: any) {});
        expect(params.length).to.eq(3);
        expect(params[0].name).to.eq('a');
        expect(params[1].name).to.eq('b');
        expect(params[2].name).to.eq('c');

        params = getParametersDefinition(Test.prototype.generator);
        expect(params.length).to.eq(1);
        expect(params[0].name).to.eq('a');

        params = getParametersDefinition(TestFn.prototype.generator);
        expect(params.length).to.eq(1);
        expect(params[0].name).to.eq('a');
    });

    it('Get Parameters Definition Can Define Parameters From Async Generator Function Or Method', () => {
        let params = getParametersDefinition(async function* (a: any, b: any, c: any) {});
        expect(params.length).to.eq(3);
        expect(params[0].name).to.eq('a');
        expect(params[1].name).to.eq('b');
        expect(params[2].name).to.eq('c');

        params = getParametersDefinition(Test.prototype.asyncGenerator);
        expect(params.length).to.eq(1);
        expect(params[0].name).to.eq('a');

        params = getParametersDefinition(TestFn.prototype.asyncGenerator);
        expect(params.length).to.eq(1);
        expect(params[0].name).to.eq('a');
    });

    it('Get Parameters Definition Can Define Parameters Name', () => {
        const params = getParametersDefinition(
            (a: string, b: string = '', { pretty }: { pretty: boolean } = { pretty: false }) => {}
        );

        expect(params[0].name).to.eq('a');
        expect(params[1].name).to.eq('b');
        expect(params[2].name).to.eq('[Destructured]');
    });

    it('Get Parameters Definition Can Define Parameters Index', () => {
        const params = getParametersDefinition(
            (a: string, b: string = '', { pretty }: { pretty: boolean } = { pretty: false }) => {}
        );

        expect(params[0].index).to.eq(0);
        expect(params[1].index).to.eq(1);
        expect(params[2].index).to.eq(2);
    });

    it('Get Parameters Definition Can Define Parameters Has Default', () => {
        const params = getParametersDefinition(
            (a: string, b: string = '', { pretty }: { pretty: boolean } = { pretty: false }) => {}
        );

        expect(params[0].hasDefault).to.be.false;
        expect(params[1].hasDefault).to.be.true;
        expect(params[2].hasDefault).to.be.true;
    });

    it('Get Parameters Definition Can Define Parameters Raw Default Values Literal Or Array|Object Expression When Empty', () => {
        const params = getParametersDefinition(
            (
                a: string = 'a',
                b: number = 1,
                c: string[] = [],
                d: any = {},
                e: string[] = ['a', 'v', 'c'],
                { pretty }: { pretty: boolean } = { pretty: false }
            ) => {}
        );

        expect(params[0].rawDefaultValue).to.eq('a');
        expect(params[1].rawDefaultValue).to.eq(1);
        expect(params[2].rawDefaultValue).to.eql([]);
        expect(params[3].rawDefaultValue).to.eql({});
        expect(params[4].rawDefaultValue).to.eq(undefined);
        expect(params[5].rawDefaultValue).to.eq(undefined);
    });

    it('Get Parameters Definition Can Define Parameters Allows Null On Default Null Or Undefined', () => {
        const params = getParametersDefinition(
            (a: string, b: any | null = null, c: string | undefined = undefined) => {}
        );
        expect(params[0].allowsNull).to.be.false;
        expect(params[1].allowsNull).to.be.true;
        expect(params[2].allowsNull).to.be.true;
    });

    it('Get Parameters Definition Can Define Is Variadic', () => {
        const params = getParametersDefinition((a: string, ...b: string[]) => {});
        expect(params[0].isVariadic).to.be.false;
        expect(params[1].isVariadic).to.be.true;
    });

    it('Get Parameters Definition Can Define Destructured Parameters', () => {
        let params = getParametersDefinition(({ pretty }: { pretty: boolean } = { pretty: false }) => {});
        expect(params[0].name).to.eq('[Destructured]');
        expect(params[0].index).to.eq(0);
        expect(params[0].isVariadic).to.be.false;
        expect(params[0].allowsNull).to.be.false;
        expect(params[0].rawDefaultValue).to.eq(undefined);
        expect(params[0].hasDefault).to.be.true;

        params = getParametersDefinition(({ pretty }: { pretty: boolean }) => {});
        expect(params[0].name).to.eq('[Destructured]');
        expect(params[0].index).to.eq(0);
        expect(params[0].isVariadic).to.be.false;
        expect(params[0].allowsNull).to.be.false;
        expect(params[0].rawDefaultValue).to.eq(undefined);
        expect(params[0].hasDefault).to.be.false;
    });
});
