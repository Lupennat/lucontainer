if (typeof Reflect === 'undefined' || !Reflect.getMetadata) {
    throw new Error(
        `lucontainer requires a reflect polyfill. Please add 'import "reflect-metadata"' to the top of your entry point.`
    );
}

export * from './container';
export * from './decorators';
export * from './errors';
export { Container, ContextualBindingBuilder } from './types';
