import { parse } from 'acorn';
import { types } from 'node:util';
import CircularDependencyError from './errors/circular-dependency-error';
import { ReflectionParameter } from './types';

const builtinObjects = [
    Object,
    Function,
    Boolean,
    Symbol,
    Error,
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError,
    Number,
    BigInt,
    Math,
    Date,
    String,
    RegExp,
    Array,
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
    BigInt64Array,
    BigUint64Array,
    Map,
    Set,
    WeakMap,
    WeakSet,
    ArrayBuffer,
    SharedArrayBuffer,
    Atomics,
    DataView,
    JSON,
    Promise,
    Reflect,
    Proxy,
    Intl,
    Intl.Collator,
    Intl.DateTimeFormat,
    Intl.NumberFormat,
    Intl.PluralRules,
    Intl.RelativeTimeFormat,
    Intl.Locale
];

function beautifyString(str: string): string {
    return str
        .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm, '')
        .replace(/\s/gm, ' ')
        .replace(/\s\s+/g, ' ')
        .trim();
}

function acornParametersToStringParameters(acornParams: acorn.Node[], className: string): ReflectionParameter[] {
    const parameters: ReflectionParameter[] = [];
    for (let x = 0; x < acornParams.length; x++) {
        const acornParam = acornParams[x];
        const param: ReflectionParameter = {
            className,
            name: '',
            isVariadic: false,
            allowsNull: false,
            hasDefault: false,
            rawDefaultValue: null,
            index: x
        };

        let left, right;

        switch (acornParam.type) {
            case 'Identifier':
                // @ts-expect-error
                param.name = acornParam.name;
                break;
            case 'AssignmentPattern':
                // @ts-expect-error
                left = acornParam.left;
                // @ts-expect-error
                right = acornParam.right;
                param.name = left.type === 'ObjectPattern' ? '[Destructured]' : left.name;
                param.hasDefault = true;
                param.rawDefaultValue = null;
                if (right.type === 'Literal') {
                    param.rawDefaultValue = right.value;
                }

                if (right.type === 'ArrayExpression') {
                    param.rawDefaultValue = right.elements.length === 0 ? [] : null;
                }

                if (right.type === 'ObjectExpression') {
                    param.rawDefaultValue = right.properties.length === 0 ? {} : null;
                }

                if (
                    (right.type === 'Literal' && right.raw === 'null') ||
                    (right.type === 'Identifier' && right.name === 'undefined')
                ) {
                    param.allowsNull = true;
                }
                break;
            case 'RestElement':
                // @ts-expect-error
                param.name = acornParam.argument.name;
                param.isVariadic = true;
                break;
            case 'ObjectPattern':
                param.name = '[Destructured]';
                break;
        }

        parameters.push(param);
    }

    return parameters;
}

export function isFunctionConstructor(fn: Function): boolean {
    try {
        const Proxied = new Proxy(fn as FunctionConstructor, {
            construct() {
                return {};
            }
        });
        // eslint-disable-next-line no-new
        new Proxied();
        return fn.name !== '';
    } catch (err) {
        return false;
    }
}

/**
 * If the given value is not an array and not null, wrap it in one.
 */
export function arrayWrap<T = undefined>(value: T | T[]): T[] {
    if (value == null) {
        return [];
    }

    return Array.isArray(value) ? value : [value];
}

/**
 * Get the class of the given parameter's type, if possible.
 *
 * @todo improve when ECMASCRIPTdecorator stage3
 */
export function getParameterClass(parameter: ReflectionParameter): any {
    if (parameter.type == null || builtinObjects.includes(parameter.type)) {
        return null;
    }

    if (typeof parameter.type !== 'function' && typeof parameter.type !== 'string') {
        throw new CircularDependencyError(
            `Unresolvable dependency resolving [[Parameter #${parameter.index} [ <required> ${parameter.name} ]] in class ${parameter.className} inside circular dependency.`
        );
    }

    return parameter.type;
}

/**
 * Return the default value of the given value.
 */
export function unwrapIfClosure(value: any, ...args: any): any {
    return typeof value === 'function' && !isFunctionConstructor(value) ? value(...args) : value;
}

/**
 * Prevent catch reserved Properties
 */
export function dontTrapProperty(property: string | symbol): boolean {
    return (
        typeof property === 'symbol' ||
        property.startsWith('#') ||
        property === 'then' ||
        property === 'catch' ||
        property === 'finally' ||
        property === 'arguments' ||
        property === 'prototype' ||
        property === 'constructor' ||
        property === 'toJSON'
    );
}

/**
 * Return parameters definition from a function
 */
export function getParametersDefinition(
    fn: Function,
    className: string = '',
    isConstructorFunction: boolean = false
): ReflectionParameter[] {
    let fnStr = beautifyString(
        isConstructorFunction
            ? Function.prototype.toString.call(fn.prototype.constructor)
            : Function.prototype.toString.call(fn)
    );

    if (types.isAsyncFunction(fn)) {
        fnStr = fnStr.replace('async', '').trim();
    }

    if (fnStr.startsWith('[')) {
        const regex = /\](?=([^"']*"[^"']*")*[^"']*$)/g;
        const end = regex.exec(fnStr) as RegExpExecArray;
        const toReplace = fnStr.substring(0, end.index + 1);
        fnStr = fnStr.replace(toReplace, 'replaced');
    }

    if (isConstructorFunction) {
        // class {} is not parsable
        // try to make a stupid class replace
        fnStr = fnStr
            .replace('class {', 'class ' + (className === '' ? 'anonymous' : className) + ' {')
            .replace('class{', 'class ' + (className === '' ? 'anonymous' : className) + ' {');

        // fn from variable should not have name
        fnStr = fnStr.startsWith('function')
            ? fnStr
                  .replace('function(', 'function ' + fn.name + ' (')
                  .replace('function (', 'function ' + fn.name + ' (')
            : fnStr;

        const ast = parse(fnStr, { ecmaVersion: 2022 });
        // @ts-expect-error
        let node = ast.body[0];

        if (node.type === 'ClassDeclaration') {
            node = node.body.body.find((node: any) => {
                return node.kind === 'constructor';
            });
            if (node != null) {
                node = node.value;
            } else {
                node = { params: [] };
            }
        }
        return acornParametersToStringParameters(node.params, className);
    }

    if (fn.name !== '') {
        fnStr = fnStr.startsWith('function') ? fnStr : 'function ' + fnStr;
        const ast = parse(fnStr, { ecmaVersion: 2022 });
        // @ts-expect-error
        const node: any = ast.body[0];

        return acornParametersToStringParameters(node.params, className);
    }

    const ast = parse('const t = ' + fnStr, { ecmaVersion: 2022 });
    // @ts-expect-error
    let node: any = ast.body[0];
    node = node.declarations[0];
    node = node.init;

    return acornParametersToStringParameters(node.params, className);
}
