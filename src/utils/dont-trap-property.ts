const reservedSymbols = [
    Symbol.asyncIterator,
    Symbol.hasInstance,
    Symbol.isConcatSpreadable,
    Symbol.iterator,
    Symbol.match,
    Symbol.matchAll,
    Symbol.replace,
    Symbol.search,
    Symbol.split,
    Symbol.species,
    Symbol.toPrimitive,
    Symbol.toStringTag,
    Symbol.unscopables
];

/**
 * Prevent catch reserved Properties
 */
function dontTrapProperty(property: string | symbol): boolean {
    return (
        (typeof property === 'symbol' && reservedSymbols.includes(property)) ||
        (typeof property === 'string' &&
            (property.startsWith('#') ||
                property === 'then' ||
                property === 'catch' ||
                property === 'finally' ||
                property === 'arguments' ||
                property === 'prototype' ||
                property === 'constructor' ||
                property === 'toJSON'))
    );
}

export default dontTrapProperty;
