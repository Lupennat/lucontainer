function isFunctionConstructor(fn: Function): boolean {
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

export default isFunctionConstructor;
