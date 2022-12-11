import { parse } from 'acorn';
import { types } from 'node:util';
import ReflectionError from './errors/reflection-error';
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

function acornParametersToStringParameters(acornParams: acorn.Node[], className: string = ''): ReflectionParameter[] {
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
                param.name = left.type === 'ObjectPattern' ? 'Object' : left.name;
                param.hasDefault = true;
                param.rawDefaultValue = right.type === 'Literal' ? right.value : null;
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
                param.name = 'Object';
                break;
            default:
                throw new ReflectionError(`Parameter Type ${acornParam.type} could not be processed`);
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
export function getParameterClassName(parameter: ReflectionParameter): any {
    if (parameter.type === undefined || builtinObjects.includes(parameter.type)) {
        return null;
    }

    // todo when type === this what will happen
    // return type

    return parameter.type;
}

/**
 * Return the default value of the given value.
 */
export function unwrapIfClosure(value: any, ...args: any): any {
    return typeof value === 'function' && !isFunctionConstructor(value) ? value(...args) : value;
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
        if (fnStr.startsWith('async ')) {
            fnStr = fnStr.replace('async ', '');
        }
    }

    if (fnStr.startsWith('[')) {
        const end = fnStr.indexOf(']');
        const toReplace = fnStr.substring(0, end + 1);
        fnStr = fnStr.replace(toReplace, fn.name !== '' ? fn.name : 'replaced');
    }

    if (isConstructorFunction) {
        try {
            // class {} is not parsable
            // try to make a stupid class replace
            fnStr = fnStr.replace('class {', 'class ' + (className === '' ? 'anonymous' : className) + ' {');

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
            } else {
                if ((node.type as string) !== 'FunctionDeclaration') {
                    throw new ReflectionError(
                        'Expected FunctionDeclaration or ClassDeclaration got ' + (node.type as string)
                    );
                }
            }

            return acornParametersToStringParameters(node.params, className);
        } catch (error) {
            // native constructor raise error
            return [];
        }
    }

    if (fn.name !== '') {
        fnStr = fnStr.startsWith('function') ? fnStr : 'function ' + fnStr;
        const ast = parse(fnStr, { ecmaVersion: 2022 });
        // @ts-expect-error
        const node: any = ast.body[0];
        if (node.type !== 'FunctionDeclaration') {
            throw new ReflectionError('Expected FunctionDeclaration got ' + (node.type as string));
        }

        return acornParametersToStringParameters(node.params, className);
    }

    const ast = parse('const t = ' + fnStr, { ecmaVersion: 2022 });
    // @ts-expect-error
    let node: any = ast.body[0];
    if (node.type !== 'VariableDeclaration') {
        throw new ReflectionError('Expected VariableDeclaration got ' + (node.type as string));
    }
    node = node.declarations[0];
    if (node.type !== 'VariableDeclarator') {
        throw new ReflectionError('Expected VariableDeclarator got ' + (node.type as string));
    }
    node = node.init;
    if (node.type !== 'FunctionExpression' && node.type !== 'ArrowFunctionExpression') {
        throw new ReflectionError(
            'Expected FunctionExpression or ArrowFunctionExpression got ' + (node.type as string)
        );
    }

    return acornParametersToStringParameters(node.params, className);
}
