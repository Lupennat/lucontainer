export interface ReflectionParameter {
    className: string;
    name: string;
    isVariadic: boolean;
    allowsNull: boolean;
    hasDefault: boolean;
    rawDefaultValue: undefined | any;
    index: number;
    type?: any;
}

export type ContainerTag = string;
export type ContainerClass<T = unknown> = new (...args: any[]) => T;
export type ContainerNewable<T = unknown> = ContainerClass<T> | (abstract new (...args: any[]) => T);
export type ContainerAbstract<T = unknown> = string | symbol | ContainerNewable<T>;
export type ContainerConcreteFunction<T = unknown> = (container: Container, parameters: ContainerParameters) => T;
export type ContainerConcrete<T = unknown> = ContainerConcreteFunction<T> | ContainerNewable<T>;
export type ContainerExtendFunction<T = unknown> = (instance: any, container: Container) => T;
/**
 * [class, method, static]
 */
export type ContainerClassMethod<T = unknown> = [ContainerNewable<T>, string | symbol, boolean?];
/**
 * [object, method]
 */
export type ContainerInstanceMethod = [Object, string | symbol];
export type ContainerMethodBindingFunction<T = unknown> = (instance: any, container: Container) => T;
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
export type ContainerCallable<T = unknown> =
    | ContainerClassMethod<T>
    | ContainerInstanceMethod
    | ContainerCallableFunction<T>;
export type ContextualAbstract<T = unknown> = string | symbol | ContainerNewable<T>;
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
    /**
     * Define a contextual binding.
     */
    when: (concrete: ContainerNewable | ContainerNewable[]) => ContextualBindingBuilder;

    /**
     * Determine if the given abstract type has been bound.
     */
    bound: (abstract: ContainerAbstract) => boolean;

    /**
     * Returns true if the container can return an entry for the given identifier.
     * Returns false otherwise.
     */
    has: (abstract: ContainerAbstract) => boolean;

    /**
     * Determine if the given abstract type has been resolved.
     */
    resolved: (abstract: ContainerAbstract) => boolean;

    /**
     * Determine if a given type is shared.
     */
    isShared: (abstract: ContainerAbstract) => boolean;

    /**
     * Determine if a given string is an alias.
     */
    isAlias: (abstract: ContainerAbstract) => boolean;

    /**
     * Register a binding with the container.
     */
    bind: <T>(abstract: ContainerAbstract<T>, concrete?: ContainerConcrete<T> | null, shared?: boolean) => void;

    /**
     * Determine if the container has a method binding.
     */
    hasMethodBinding: (method: ContainerClassMethod) => boolean;

    /**
     * Bind a callback to resolve with Container.call.
     */
    bindMethod: <T>(method: ContainerClassMethod, callback: ContainerMethodBindingFunction<T>) => void;

    /**
     * Get the method binding for the given method.
     */
    callMethodBinding: (method: ContainerClassMethod, instance: any) => any;

    /**
     * Add a contextual binding to the container.
     */
    addContextualBinding: (
        concrete: ContainerNewable,
        abstract: ContextualAbstract,
        implementation: ContextualImplementation
    ) => void;

    /**
     * Register a binding if it hasn't already been registered.
     */
    bindIf: <T>(abstract: ContainerAbstract<T>, concrete?: ContainerConcrete<T> | null, shared?: boolean) => void;

    /**
     * Register a shared binding in the container.
     */
    singleton: <T>(abstract: ContainerAbstract<T>, concrete?: ContainerConcrete<T> | null) => void;

    /**
     * Register a shared binding if it hasn't already been registered.
     */
    singletonIf: <T>(abstract: ContainerAbstract<T>, concrete?: ContainerConcrete<T> | null) => void;

    /**
     * Register a scoped binding in the container.
     */
    scoped: <T>(abstract: ContainerAbstract<T>, concrete?: ContainerConcrete<T> | null) => void;

    /**
     * Register a scoped binding if it hasn't already been registered.
     */
    scopedIf: <T>(abstract: ContainerAbstract<T>, concrete?: ContainerConcrete<T> | null) => void;

    /**
     * "Extend" an abstract type in the container.
     */
    extend: <T>(abstract: ContainerAbstract<T>, closure: ContainerExtendFunction<T>) => void;

    /**
     * Register an existing instance as shared in the container.
     */
    instance: <T>(abstract: ContainerAbstract<T>, instance: T) => T;

    /**
     * Assign a set of tags to a given binding.
     */
    tag: (
        abstracts: ContainerAbstract | ContainerAbstract[],
        tags: ContainerTag[] | ContainerTag,
        ...others: ContainerTag[]
    ) => void;

    /**
     * Resolve all of the bindings for a given tag.
     */
    tagged: (tag: ContainerTag) => any[];

    /**
     * Alias a type to a different name.
     */
    alias: (abstract: ContainerAbstract, alias: ContainerAbstract) => void;

    /**
     * Bind a new callback to an abstract's rebind event.
     */
    rebinding: <T>(abstract: ContainerAbstract<T>, callback: ContainerReboundFunction) => T | undefined;

    /**
     * Refresh an instance on the given target and method.
     */
    refresh: <T>(abstract: ContainerAbstract<T>, target: any, method: string | symbol) => T | undefined;

    /**
     * Wrap the given closure such that its dependencies will be injected when executed.
     */
    wrap: <T>(callback: ContainerCallableFunction<T>, parameters?: ContainerParameters) => ContainerWrappedFunction<T>;

    /**
     * Call the given Closure / [class, method] and inject its dependencies.
     */
    call: <T>(callback: ContainerCallable<T>, parameters?: ContainerParameters) => any;

    /**
     * Get a closure to resolve the given type from the container.
     */
    factory: <T>(abstract: ContainerAbstract<T>) => ContainerFactory<T>;

    /**
     * An alias function name for make().
     */
    makeWith: <T>(abstract: ContainerAbstract<T>, parameters: ContainerParameters) => T;

    /**
     * Resolve the given type from the container.
     */
    make: <T>(abstract: ContainerAbstract<T>, parameters?: ContainerParameters) => T;

    /**
     * Finds an entry of the container by its identifier and returns it.
     */
    get: <T>(abstract: ContainerAbstract<T>) => T;

    /**
     * Instantiate a concrete instance of the given type.
     */
    build: <T>(concrete: ContainerConcrete<T>) => any | undefined;

    /**
     * Register a new before resolving callback for all types.
     */
    beforeResolving:
        | ((callback: ContainerBeforeResolvingFunction) => void)
        | ((abstract: ContainerAbstract, callback: ContainerBeforeResolvingFunction) => void)
        | ((
              abstractOrCallback: ContainerAbstract | ContainerBeforeResolvingFunction,
              callback?: ContainerBeforeResolvingFunction | null
          ) => void);

    /**
     * Register a new resolving callback.
     */
    resolving:
        | ((callback: ContainerResolvingFunction) => void)
        | ((abstract: ContainerAbstract, callback: ContainerResolvingFunction) => void)
        | ((
              abstractOrCallback: ContainerAbstract | ContainerResolvingFunction,
              callback?: ContainerResolvingFunction | null
          ) => void);

    /**
     * Register a new after resolving callback for all types.
     */
    afterResolving:
        | ((callback: ContainerAfterResolvingFunction) => void)
        | ((abstract: ContainerAbstract, callback: ContainerAfterResolvingFunction) => void)
        | ((
              abstractOrCallback: ContainerAbstract | ContainerAfterResolvingFunction,
              callback?: ContainerAfterResolvingFunction | null
          ) => void);

    /**
     * Get the container's bindings.
     */
    getBindings: () => Map<ContainerAbstract, ContainerBinding>;

    /**
     * Get the alias for an abstract if available.
     */
    getAlias: <T>(abstract: ContainerAbstract<T>) => ContainerAbstract<T>;

    /**
     * Remove all of the extender callbacks for a given type.
     */
    forgetExtenders: (abstract: ContainerAbstract) => void;

    /**
     * Remove a resolved instance from the instance cache.
     */
    forgetInstance: (abstract: ContainerAbstract) => void;

    /**
     * Clear all of the instances from the container.
     */
    forgetInstances: () => void;

    /**
     * Clear all of the scoped instances from the container.
     */
    forgetScopedInstances: () => void;

    /**
     * Flush the container of all bindings and resolved instances.
     */
    flush: () => void;
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
}
