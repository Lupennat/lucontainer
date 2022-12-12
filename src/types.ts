export interface ReflectionParameter {
    className: string;
    name: string;
    isVariadic: boolean;
    allowsNull: boolean;
    hasDefault: boolean;
    rawDefaultValue: null | any;
    index: number;
    type?: any;
}

export type ContainerTag = string;
export type ContainerClass<T = unknown> = new (...args: any[]) => T;
export type ContainerNewable<T = unknown> = ContainerClass<T> | (abstract new (...args: any[]) => T);
export type ContainerAbstract<T = unknown> = string | ContainerNewable<T>;
export type ContainerConcreteFunction<T = unknown> = (container: Container, parameters: ContainerParameters) => T;
export type ContainerConcrete<T = unknown> = ContainerConcreteFunction<T> | ContainerNewable<T>;
export type ContainerExtendFunction<T = unknown> = (instance: any, container: Container) => T;
export type ContainerBeforeResolvingFunction<T = unknown> = (
    instance: any,
    parameters: ContainerParameters,
    container: Container
) => T;
export type ContainerResolvingFunction<T = unknown> = (instance: any, container: Container) => T;
export type ContainerAfterResolvingFunction<T = unknown> = (instance: any, container: Container) => T;
export type ContainerReboundFunction = (container: Container, instance: any) => void;
export type ContainerWrappedFunction<T = unknown> = () => T;
export type ContainerFactory<T = unknown> = () => T;
export type ContainerCallableFunction<T = unknown> = (...args: any[]) => T;
export type ContainerCallable<T = unknown> = ContainerNewable<T> | ContainerCallableFunction<T>;
export type ContextualAbstract<T = unknown> = string | ContainerNewable<T>;
export type ContextualImplementation = any;

type NotArray<T = unknown> = T extends T[] ? never : T;
export interface ContainerKeyValParameters {
    [key: string]: NotArray;
}

export type ContainerParameters = ContainerKeyValParameters | any[];

export interface ContainerBinding {
    concrete: ContainerConcreteFunction;
    shared: boolean;
}

export interface Container {
    addContextualBinding: (
        concrete: ContainerNewable,
        abstract: ContextualAbstract,
        implementation: ContextualImplementation
    ) => void;
    get: <T>(abstract: ContainerAbstract<T>) => T;
    make: <T>(abstract: ContainerAbstract<T>, parameters?: ContainerParameters) => T;
    tagged: (tag: ContainerTag) => any[];
}

export interface Config {
    get: <T>(key: string, defaultValue?: T) => T | undefined;
}

export interface ContextualBindingBuilder {
    /**
     * Define the abstract target that depends on the context.
     */
    needs: (abstract: ContextualAbstract) => this;

    /**
     * Define the implementation for the contextual binding.
     */
    give: (implementation: ContextualImplementation) => void;

    /**
     * Define tagged services to be used as the implementation for the contextual binding.
     */
    giveTagged: (tag: string) => void;

    /**
     * Specify the configuration item to bind as a primitive.
     */
    giveConfig: (key: string, defaultValue?: any) => void;
}
