if (typeof Reflect === 'undefined' || !Reflect.getMetadata) {
    throw new Error(
        `lucontainer requires a reflect polyfill. Please add 'import "reflect-metadata"' to the top of your entry point.`
    );
}

export { default as Container } from './container';
export { default as ContextualBindingBuilder } from './contextual-binding-builder';
export * from './decorators';
export * from './errors';
export { ContainerI, ContextualBindingBuilderI } from './types';
