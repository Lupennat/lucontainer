import isFunctionConstructor from './is-function-constructor';

/**
 * Return the default value of the given value.
 */
function unwrapIfClosure(value: any, ...args: any): any {
    return typeof value === 'function' && !isFunctionConstructor(value) ? value(...args) : value;
}

export default unwrapIfClosure;
