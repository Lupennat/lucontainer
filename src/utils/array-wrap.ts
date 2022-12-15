/**
 * If the given value is not an array and not null, wrap it in one.
 */
function arrayWrap<T = undefined>(value: T | T[]): T[] {
    if (value == null) {
        return [];
    }

    return Array.isArray(value) ? value : [value];
}

export default arrayWrap;
