import { ReflectionParameter } from '../types';

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

/**
 * Get the class of the given parameter's type, if possible.
 */
function getParameterClass(parameter: ReflectionParameter): any {
    if (parameter.type == null || builtinObjects.includes(parameter.type)) {
        return null;
    }

    return parameter.type;
}

export default getParameterClass;
