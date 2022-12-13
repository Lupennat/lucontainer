import BindingResolutionError from '../errors/binding-resolution-error';
import LogicError from '../errors/logic-error';
import {
    Container as ContainerContract,
    ContainerAbstract,
    ContainerAfterResolvingFunction,
    ContainerBeforeResolvingFunction,
    ContainerBinding,
    ContainerCallable,
    ContainerCallableFunction,
    ContainerClass,
    ContainerClassMethod,
    ContainerConcrete,
    ContainerConcreteFunction,
    ContainerExtendFunction,
    ContainerFactory,
    ContainerKeyValParameters,
    ContainerMethodBindingFunction,
    ContainerNewable,
    ContainerParameters,
    ContainerReboundFunction,
    ContainerResolvingFunction,
    ContainerTag,
    ContainerWrappedFunction,
    ContextualAbstract,
    ContextualBindingBuilder as ContextualBindingBuilderContract,
    ContextualImplementation,
    ReflectionParameter
} from '../types';
import { arrayWrap, dontTrapProperty, getParameterClass, isFunctionConstructor, unwrapIfClosure } from '../utils';
import ContextualBindingBuilder from './contextual-binding-builder';

declare type AfterResolvingMap = Map<ContainerAbstract, ContainerAfterResolvingFunction[]>;
declare type ResolvingMap = Map<ContainerAbstract, ContainerResolvingFunction[]>;
declare interface BindingMethods {
    proto: {
        [key: string | symbol]: ContainerMethodBindingFunction;
    };
    static: {
        [key: string | symbol]: ContainerMethodBindingFunction;
    };
}

class Container implements ContainerContract {
    protected static instance: ContainerContract | null = null;
    protected aliasesMap: Map<ContainerAbstract, any> = new Map();
    protected abstractAliasesMap: Map<ContainerAbstract, ContainerAbstract[]> = new Map();
    protected resolvedMap: Map<ContainerAbstract, boolean> = new Map();
    protected bindingsMap: Map<ContainerAbstract, ContainerBinding> = new Map();

    protected instancesMap: Map<ContainerAbstract, any> = new Map();
    protected scopedInstancesSet: Set<ContainerAbstract> = new Set();
    protected extendersMap: Map<ContainerAbstract, ContainerExtendFunction[]> = new Map();
    protected tagsMap: Map<ContainerTag, ContainerAbstract[]> = new Map();
    protected reboundCallbacksMap: Map<ContainerAbstract, ContainerReboundFunction[]> = new Map();
    protected with: ContainerParameters[] = [];
    protected globalAfterResolvingCallbacks: ContainerAfterResolvingFunction[] = [];
    protected globalBeforeResolvingCallbacks: ContainerBeforeResolvingFunction[] = [];
    protected globalResolvingCallbacks: ContainerResolvingFunction[] = [];
    protected afterResolvingCallbacksMap: AfterResolvingMap = new Map();
    protected beforeResolvingCallbacksMap: Map<ContainerAbstract, ContainerBeforeResolvingFunction[]> = new Map();
    protected resolvingCallbacksMap: ResolvingMap = new Map();
    protected contextualMap: Map<ContainerNewable, Map<ContextualAbstract, ContextualImplementation>> = new Map();
    protected buildStack: ContainerNewable[] = [];
    protected methodBindingsMap: Map<ContainerNewable, BindingMethods> = new Map();

    constructor() {
        let magicHasIsEnabled = true;
        return new Proxy(this, {
            get(target, p, receiver) {
                magicHasIsEnabled = false;
                const exists = Reflect.has(target, p);
                magicHasIsEnabled = true;

                if (exists || dontTrapProperty(p)) {
                    return Reflect.get(target, p, receiver);
                }
                return target.make.call(receiver, p as string);
            },
            has(target, p): boolean {
                if (!magicHasIsEnabled || dontTrapProperty(p)) {
                    return Reflect.has(target, p);
                }

                if (Reflect.has(target, p)) {
                    return true;
                } else {
                    return target.bound(p as string);
                }
            },
            set(target, p, newValue, receiver): boolean {
                magicHasIsEnabled = false;
                const exists = Reflect.has(target, p);
                magicHasIsEnabled = true;

                if (exists || dontTrapProperty(p)) {
                    return Reflect.set(target, p, newValue, receiver);
                }

                target.bind.call(
                    receiver,
                    p as string,
                    typeof newValue === 'function' && !isFunctionConstructor(newValue)
                        ? newValue
                        : function () {
                              return newValue;
                          }
                );

                return true;
            },
            deleteProperty(target, p): boolean {
                magicHasIsEnabled = false;
                const exists = Reflect.has(target, p);
                magicHasIsEnabled = true;

                if (exists || dontTrapProperty(p)) {
                    return Reflect.deleteProperty(target, p);
                }

                target.bindingsMap.delete(p as string);
                target.instancesMap.delete(p as string);
                target.resolvedMap.delete(p as string);

                return true;
            }
        });
    }

    /**
     * Define a contextual binding.
     */
    public when(concrete: ContainerNewable | ContainerNewable[]): ContextualBindingBuilderContract {
        const aliases = arrayWrap<ContainerNewable>(concrete);

        return new ContextualBindingBuilder(this, aliases);
    }

    /**
     * Determine if the given abstract type has been bound.
     */
    public bound(abstract: ContainerAbstract): boolean {
        return this.bindingsMap.has(abstract) || this.instancesMap.has(abstract) || this.isAlias(abstract);
    }

    /**
     * Returns true if the container can return an entry for the given identifier.
     * Returns false otherwise.
     */
    public has(abstract: ContainerAbstract): boolean {
        return this.bound(abstract);
    }

    /**
     * Determine if the given abstract type has been resolved.
     */
    public resolved(abstract: ContainerAbstract): boolean {
        if (this.isAlias(abstract)) {
            abstract = this.getAlias(abstract);
        }

        return this.resolvedMap.has(abstract) || this.instancesMap.has(abstract);
    }

    /**
     * Determine if a given type is shared.
     */
    public isShared(abstract: ContainerAbstract): boolean {
        return (
            this.instancesMap.has(abstract) ||
            (this.bindingsMap.has(abstract) ? (this.bindingsMap.get(abstract) as ContainerBinding).shared : false)
        );
    }

    /**
     * Determine if a given string is an alias.
     */
    public isAlias(abstract: ContainerAbstract): boolean {
        return this.aliasesMap.has(abstract);
    }

    /**
     * Register a binding with the container.
     */
    public bind<T>(
        abstract: ContainerAbstract<T>,
        concrete: ContainerConcrete<T> | null = null,
        shared: boolean = false
    ): void {
        this.dropStaleInstances(abstract);

        // If no concrete type was given, we will simply set the concrete type to the
        // abstract type. After that, the concrete type to be registered as shared
        // without being forced to state their classes in both of the parameters.
        if (concrete == null) {
            if (typeof abstract === 'string') {
                throw new Error(`please provide a concrete for abstract ${abstract}.`);
            }
            concrete = abstract;
        }

        if (typeof concrete !== 'function') {
            throw new Error(`concrete should be a closure or a class, "${typeof concrete}" given.`);
        }

        const concreteFunction = isFunctionConstructor(concrete)
            ? this.getClosure(abstract, concrete as ContainerNewable<T>)
            : (concrete as ContainerConcreteFunction<T>);

        this.bindingsMap.set(abstract, {
            concrete: concreteFunction,
            shared
        });

        // If the abstract type was already resolved in this container we'll fire the
        // rebound listener so that any objects which have already gotten resolved
        // can have their copy of the object updated via the listener callbacks.
        if (this.resolved(abstract)) {
            this.rebound<T>(abstract);
        }
    }

    /**
     * Get the Closure to be used when building a type.
     */
    protected getClosure<T>(
        abstract: ContainerAbstract<T>,
        concrete: ContainerNewable<T>
    ): ContainerConcreteFunction<T> {
        return (container: ContainerContract, parameters: ContainerParameters = {}) => {
            if (abstract === concrete) {
                return this.build<T>(concrete);
            }
            return this.resolve<T>(concrete, parameters, false);
        };
    }

    /**
     * Determine if the container has a method binding.
     */
    public hasMethodBinding(method: ContainerClassMethod): boolean {
        const isStatic = method[2] ?? false;
        return (
            this.methodBindingsMap.has(method[0]) &&
            method[1] in (this.methodBindingsMap.get(method[0]) as BindingMethods)[isStatic ? 'static' : 'proto']
        );
    }

    /**
     * Bind a callback to resolve with Container.call.
     */
    public bindMethod<T>(method: ContainerClassMethod, callback: ContainerMethodBindingFunction<T>): void {
        const isStatic = method[2] ?? false;
        const methods = this.methodBindingsMap.get(method[0]) ?? {
            proto: {},
            static: {}
        };
        methods[isStatic ? 'static' : 'proto'][method[1]] = callback;

        this.methodBindingsMap.set(method[0], methods);
    }

    /**
     * Get the method binding for the given method.
     */
    public callMethodBinding(method: ContainerClassMethod, instance: any): any {
        const isStatic = method[2] ?? false;
        const fnToCall = (this.methodBindingsMap.get(method[0]) as BindingMethods)[isStatic ? 'static' : 'proto'][
            method[1]
        ];

        return fnToCall(instance, this);
    }

    /**
     * Add a contextual binding to the container.
     */
    public addContextualBinding(
        concrete: ContainerNewable,
        abstract: ContextualAbstract,
        implementation: ContextualImplementation
    ): void {
        abstract = this.getAlias(abstract);
        const abstractsMap = this.contextualMap.get(concrete) ?? new Map();
        abstractsMap.set(abstract, implementation);

        this.contextualMap.set(concrete, abstractsMap);
    }

    /**
     * Register a binding if it hasn't already been registered.
     */
    public bindIf<T>(
        abstract: ContainerAbstract<T>,
        concrete: ContainerConcrete<T> | null = null,
        shared: boolean = false
    ): void {
        if (!this.has(abstract)) {
            this.bind<T>(abstract, concrete, shared);
        }
    }

    /**
     * Register a shared binding in the container.
     */
    public singleton<T>(abstract: ContainerAbstract<T>, concrete: ContainerConcrete<T> | null = null): void {
        this.bind(abstract, concrete, true);
    }

    /**
     * Register a shared binding if it hasn't already been registered.
     */
    public singletonIf<T>(abstract: ContainerAbstract<T>, concrete: ContainerConcrete<T> | null = null): void {
        if (!this.has(abstract)) {
            this.singleton<T>(abstract, concrete);
        }
    }

    /**
     * Register a scoped binding in the container.
     */
    public scoped<T>(abstract: ContainerAbstract<T>, concrete: ContainerConcrete<T> | null = null): void {
        if (!this.scopedInstancesSet.has(abstract)) {
            this.scopedInstancesSet.add(abstract);
        }
        this.singleton(abstract, concrete);
    }

    /**
     * Register a scoped binding if it hasn't already been registered.
     */
    public scopedIf<T>(abstract: ContainerAbstract<T>, concrete: ContainerConcrete<T> | null = null): void {
        if (!this.bound(abstract)) {
            this.scoped(abstract, concrete);
        }
    }

    /**
     * "Extend" an abstract type in the container.
     */
    public extend<T>(abstract: ContainerAbstract<T>, closure: ContainerExtendFunction<T>): void {
        abstract = this.getAlias<T>(abstract);

        if (this.instancesMap.has(abstract)) {
            this.instancesMap.set(abstract, closure(this.instancesMap.get(abstract), this));
            this.rebound<T>(abstract);
        } else {
            const extenders = this.extendersMap.has(abstract)
                ? (this.extendersMap.get(abstract) as Array<ContainerExtendFunction<T>>)
                : [];

            extenders.push(closure);
            this.extendersMap.set(abstract, extenders);
            if (this.resolvedMap.has(abstract)) {
                this.rebound<T>(abstract);
            }
        }
    }

    /**
     * Register an existing instance as shared in the container.
     */
    public instance<T>(abstract: ContainerAbstract<T>, instance: T): T {
        this.removeAbstractAlias(abstract);

        const isBound = this.bound(abstract);

        this.aliasesMap.delete(abstract);

        // We'll check to determine if this type has been bound before, and if it has
        // we will fire the rebound callbacks registered with the container and it
        // can be updated with consuming classes that have gotten resolved here.
        this.instancesMap.set(abstract, instance);

        if (isBound) {
            this.rebound<T>(abstract);
        }

        return instance;
    }

    /**
     * Remove an alias from the contextual binding alias cache.
     */
    protected removeAbstractAlias(searched: ContainerAbstract): void {
        if (!this.aliasesMap.has(searched)) {
            return;
        }

        for (const [abstract, aliases] of this.abstractAliasesMap.entries()) {
            const filtered = aliases.filter(alias => alias !== searched);
            this.abstractAliasesMap.set(abstract, filtered);
        }
    }

    /**
     * Assign a set of tags to a given binding.
     */
    public tag(
        abstracts: ContainerAbstract | ContainerAbstract[],
        tags: ContainerTag[] | ContainerTag,
        ...others: ContainerTag[]
    ): void {
        tags = (Array.isArray(tags) ? tags : [tags]).concat(others);
        for (const tag of tags) {
            const availableTags = this.tagsMap.has(tag) ? (this.tagsMap.get(tag) as ContainerAbstract[]) : [];
            for (const abstract of Array.isArray(abstracts) ? abstracts : [abstracts]) {
                availableTags.push(abstract);
            }
            this.tagsMap.set(tag, availableTags);
        }
    }

    /**
     * Resolve all of the bindings for a given tag.
     */
    public tagged(tag: ContainerTag): any[] {
        return (
            this.tagsMap.get(tag)?.map(abstract => {
                return this.make(abstract);
            }) ?? []
        );
    }

    /**
     * Alias a type to a different name.
     */
    public alias(abstract: ContainerAbstract, alias: ContainerAbstract): void {
        if (alias === abstract) {
            throw new LogicError(`[${typeof abstract === 'string' ? abstract : abstract.name}] is aliased to itself.`);
        }

        this.aliasesMap.set(alias, abstract);

        const aliases = (this.abstractAliasesMap.get(abstract) as ContainerAbstract[]) ?? [];

        aliases.push(alias);

        this.abstractAliasesMap.set(abstract, aliases);
    }

    /**
     * Bind a new callback to an abstract's rebind event.
     */
    public rebinding<T>(abstract: ContainerAbstract<T>, callback: ContainerReboundFunction): T | undefined {
        abstract = this.getAlias<T>(abstract);
        const callbacks = (this.reboundCallbacksMap.get(abstract) as ContainerReboundFunction[]) ?? [];

        callbacks.push(callback);

        this.reboundCallbacksMap.set(abstract, callbacks);

        if (this.bound(abstract)) {
            return this.make<T>(abstract);
        }
    }

    /**
     * Refresh an instance on the given target and method.
     */
    public refresh<T>(abstract: ContainerAbstract<T>, target: any, method: string | symbol): T | undefined {
        return this.rebinding<T>(abstract, (container: ContainerContract, instance: any) => {
            target[method](instance);
        });
    }

    /**
     * Fire the "rebound" callbacks for the given abstract type.
     */
    protected rebound<T>(abstract: ContainerAbstract<T>): void {
        const instance = this.make(abstract);

        for (const fnToCall of this.getReboundCallbacks<T>(abstract)) {
            fnToCall(this, instance);
        }
    }

    /**
     * Get the rebound callbacks for a given type.
     *
     */
    protected getReboundCallbacks<T>(abstract: ContainerAbstract<T>): ContainerReboundFunction[] {
        return this.reboundCallbacksMap.get(abstract) ?? [];
    }

    /**
     * Wrap the given closure such that its dependencies will be injected when executed.
     */
    public wrap<T>(
        callback: ContainerCallableFunction<T>,
        parameters: ContainerParameters = {}
    ): ContainerWrappedFunction<T> {
        return () => this.call<T>(callback, parameters);
    }

    /**
     * Call the given Closure / [class, method] and inject its dependencies.
     */
    public call<T>(callback: ContainerCallable<T>, parameters: ContainerParameters = {}): any {
        return this.callBoundMethod<T>(callback, this.getContainerCallableClosure<T>(callback, parameters));
    }

    /**
     * Get the Closure to be used when buound a method.
     */
    protected getContainerCallableClosure<T>(
        fnToCall: ContainerCallable<T>,
        parameters: ContainerParameters
    ): Function {
        if (Array.isArray(fnToCall)) {
            return (instance: { [key: string | symbol]: ContainerCallableFunction }) => {
                const method = fnToCall[1];
                const abstract = (
                    typeof fnToCall[0] === 'function' ? fnToCall[0] : fnToCall[0].constructor
                ) as ContainerNewable<T>;

                return instance[method](
                    ...this.getMethodDependencies([abstract, fnToCall[1], fnToCall[2] ?? false], parameters)
                );
            };
        } else {
            return () => {
                return fnToCall(...this.getMethodDependencies(fnToCall, parameters));
            };
        }
    }

    /**
     * Call a method that has been bound to the container.
     */
    protected callBoundMethod<T>(callback: ContainerCallable<T>, closure: Function): any {
        if (!Array.isArray(callback)) {
            return unwrapIfClosure(closure);
        }

        const method = callback[1];
        const abstract = (
            typeof callback[0] === 'function' ? callback[0] : callback[0].constructor
        ) as ContainerNewable<T>;

        const isStatic = typeof callback[0] === 'function' ? callback[2] ?? false : false;

        const instance = (
            typeof callback[0] === 'function' ? (isStatic ? abstract : this.make(abstract)) : callback[0]
        ) as {
            [key: string | symbol]: ContainerCallableFunction;
        };

        if (this.hasMethodBinding([abstract, method, isStatic])) {
            return this.callMethodBinding([abstract, method, isStatic], instance);
        }

        return unwrapIfClosure(closure, instance);
    }

    /**
     * Get all dependencies for a given method.
     */
    protected getMethodDependencies<T>(
        fnToCall: ContainerClassMethod<T> | ContainerCallableFunction<T>,
        parameters: ContainerParameters
    ): any[] {
        let types: any[] = [];
        let dependencies: any[] = [];

        if (Array.isArray(fnToCall)) {
            const abstract = fnToCall[0];
            const method = fnToCall[1];
            const isStatic = fnToCall[2] ?? false;

            if (
                (isStatic && (!(method in abstract) || typeof (abstract as any)[method] !== 'function')) ||
                (!isStatic && (!(method in abstract.prototype) || typeof abstract.prototype[method] !== 'function'))
            ) {
                throw new Error(
                    `Target method [${fnToCall[0].name}.${
                        !isStatic ? 'prototype.' : ''
                    }${fnToCall[1].toString()}] is not a function.`
                );
            }

            if (
                !Reflect.hasMetadata(
                    'design:paramdefinitions',
                    isStatic ? fnToCall[0] : fnToCall[0].prototype,
                    fnToCall[1]
                )
            ) {
                throw new BindingResolutionError(
                    `Target method [${fnToCall[0].name}.${
                        !isStatic ? 'prototype.' : ''
                    }${fnToCall[1].toString()}] must be decorate with methodable!`
                );
            }

            types =
                Reflect.getMetadata('design:paramtypes', isStatic ? fnToCall[0] : fnToCall[0].prototype, fnToCall[1]) ??
                [];

            dependencies = (
                Reflect.getMetadata(
                    'design:paramdefinitions',
                    isStatic ? fnToCall[0] : fnToCall[0].prototype,
                    fnToCall[1]
                ) ?? []
            ).map((definition: ReflectionParameter, index: number) => {
                definition.type = types[index];
                return definition;
            });
        } else {
            if (!Reflect.hasMetadata('design:paramdefinitions', fnToCall)) {
                throw new BindingResolutionError(`Target function [${fnToCall.name}] must be annotate!`);
            }

            types = Reflect.getMetadata('design:paramtypes', fnToCall) ?? [];

            dependencies = (Reflect.getMetadata('design:paramdefinitions', fnToCall) ?? []).map(
                (definition: ReflectionParameter, index: number) => {
                    definition.type = types[index];
                    return definition;
                }
            );
        }

        let resolvedParameters: any[] = [];

        for (const dependency of dependencies) {
            const res = this.getDependencyForCallParameter(dependency, parameters);
            if (dependency.isVariadic && Array.isArray(res)) {
                resolvedParameters = resolvedParameters.concat(res);
            } else {
                resolvedParameters.push(res);
            }
        }

        return resolvedParameters.concat(Array.isArray(parameters) ? parameters : []);
    }

    /**
     * Get the dependency for the given call parameter.
     */
    protected getDependencyForCallParameter(parameter: ReflectionParameter, parameters: ContainerParameters): any {
        const name = parameter.name;
        if (!Array.isArray(parameters)) {
            if (name in parameters) {
                return parameters[name];
            } else if (getParameterClass(parameter) != null) {
                const resolved = this.make(getParameterClass(parameter));
                return parameter.isVariadic && !Array.isArray(resolved) ? [resolved] : resolved;
            } else if (parameter.hasDefault) {
                return undefined;
            } else {
                throw new BindingResolutionError(
                    `Unresolvable dependency resolving [[Parameter #${parameter.index} [ <required> ${parameter.name} ]] in class ${parameter.className}.`
                );
            }
        } else {
            if (getParameterClass(parameter) != null) {
                const resolved = this.make(getParameterClass(parameter));
                return parameter.isVariadic && !Array.isArray(resolved) ? [resolved] : resolved;
            } else if (parameter.hasDefault) {
                return undefined;
            } else {
                throw new BindingResolutionError(
                    `Unresolvable dependency resolving [[Parameter #${parameter.index} [ <required> ${parameter.name} ]] in class ${parameter.className}.`
                );
            }
        }
    }

    /**
     * Get a closure to resolve the given type from the container.
     */
    public factory<T>(abstract: ContainerAbstract<T>): ContainerFactory<T> {
        return () => this.make<T>(abstract);
    }

    /**
     * An alias function name for make().
     */
    public makeWith<T>(abstract: ContainerAbstract<T>, parameters: ContainerParameters): T {
        return this.make<T>(abstract, parameters);
    }

    /**
     * Resolve the given type from the container.
     */
    public make<T>(abstract: ContainerAbstract<T>, parameters: ContainerParameters = {}): T {
        return this.resolve<T>(abstract, parameters);
    }

    /**
     * Finds an entry of the container by its identifier and returns it.
     */
    public get<T>(abstract: ContainerAbstract<T>): T {
        return this.resolve<T>(abstract);
    }

    /**
     * Resolve the given type from the container.
     */
    protected resolve<T>(
        abstract: ContainerAbstract<T>,
        parameters: ContainerParameters = {},
        raiseEvents: boolean = true
    ): T {
        abstract = this.getAlias<T>(abstract);

        // First we'll fire any event handlers which handle the "before" resolving of
        // specific types. This gives some hooks the chance to add various extends
        // calls to change the resolution of objects that they're interested in.
        if (raiseEvents) {
            this.fireBeforeResolvingCallbacks(abstract, parameters);
        }

        let concrete = this.getContextualConcrete<T>(abstract);

        const needsContextualBuild = Object.keys(parameters).length > 0 || concrete != null;

        // If an instance of the type is currently being managed as a singleton we'll
        // just return an existing instance instead of instantiating new instances
        // so the developer can keep using the same objects instance every time.
        if (this.instancesMap.has(abstract) && !needsContextualBuild) {
            return this.instancesMap.get(abstract) as T;
        }

        this.with.push(parameters);

        if (concrete == null) {
            concrete = this.getConcrete(abstract);
        }

        // We're ready to instantiate an instance of the concrete type registered for
        // the binding. This will instantiate the types, as well as resolve any of
        // its "nested" dependencies recursively until all have gotten resolved.
        let object = this.isBuildable<T>(concrete, abstract)
            ? this.build<T>(concrete)
            : this.make<T>(concrete as ContainerNewable<T>);

        // If we defined any extenders for this type, we'll need to spin through them
        // and apply them to the object being built. This allows for the extension
        // of services, such as changing configuration or decorating the object.
        for (const extender of this.getExtenders(abstract) ?? []) {
            object = extender(object, this);
        }

        // If the requested type is registered as a singleton we'll want to cache off
        // the instances in "memory" so we can return it later without creating an
        // entirely new instance of an object on each subsequent request for it.
        if (this.isShared(abstract) && !needsContextualBuild) {
            this.instancesMap.set(abstract, object);
        }

        if (raiseEvents) {
            this.fireResolvingCallbacks(abstract, object);
        }

        // Before returning, we will also set the resolved flag to "true" and pop off
        // the parameter overrides for this build. After those two things are done
        // we will be ready to return back the fully constructed class instance.
        this.resolvedMap.set(abstract, true);
        this.with.pop();

        return object as T;
    }

    /**
     * Get the concrete type for a given abstract.
     */
    protected getConcrete<T>(abstract: ContainerAbstract<T>): ContainerConcrete<T> {
        // If we don't have a registered resolver or concrete for the type, we'll just
        // assume each type is a concrete name and will attempt to resolve it as is
        // since the container should be able to resolve concretes automatically.
        return (this.bindingsMap.get(abstract)?.concrete ?? abstract) as ContainerConcrete<T>;
    }

    /**
     * Get the contextual concrete binding for the given abstract.
     */
    protected getContextualConcrete<T>(abstract: ContainerAbstract<T>): ContainerConcrete<T> | undefined {
        const binding = this.findInContextualBindings<T>(abstract);
        if (binding != null) {
            return binding;
        }

        // Next we need to see if a contextual binding might be bound under an alias of the
        // given abstract type. So, we will need to check if any aliases exist with this
        // type and then spin through them and check for contextual bindings on these.
        if ((this.abstractAliasesMap.get(abstract) ?? []).length === 0) {
            return;
        }

        for (const alias of this.abstractAliasesMap.get(abstract) ?? []) {
            const binding = this.findInContextualBindings<T>(alias as ContainerAbstract<T>);
            if (binding != null) {
                return binding;
            }
        }
    }

    /**
     * Find the concrete binding for the given abstract in the contextual binding array.
     */
    protected findInContextualBindings<T>(abstract: ContainerAbstract<T>): any | undefined {
        return this.contextualMap.get(this.buildStack[this.buildStack.length - 1])?.get(abstract);
    }

    /**
     * Determine if the given concrete is buildable.
     */
    protected isBuildable<T>(
        concrete: ContainerConcrete<T> | ContextualImplementation,
        abstract: ContainerAbstract<T>
    ): boolean {
        return concrete === abstract || (typeof concrete === 'function' && !isFunctionConstructor(concrete));
    }

    /**
     * Instantiate a concrete instance of the given type.
     */
    public build<T>(concrete: ContainerConcrete<T>): any | undefined {
        // If the concrete type is actually a Closure, we will just execute it and
        // hand back the results of the functions, which allows functions to be
        // used as resolvers for more fine-tuned resolution of these objects.
        if (typeof concrete === 'function' && !isFunctionConstructor(concrete)) {
            return (concrete as ContainerConcreteFunction<T>)(this, this.getLastParameterOverride());
        }

        // try to get metadata from reflection
        // if design:paramdefinitions does not exists
        // constructable decorator is not invoked
        try {
            if (!Reflect.hasMetadata('design:paramdefinitions', concrete)) {
                throw new BindingResolutionError(
                    `Target class [${concrete.name}] must be decorate with constructable!`
                );
            }
        } catch (error) {
            if (error instanceof BindingResolutionError) {
                throw error;
            }
            throw this.notInstantiable(concrete);
        }

        //    try {
        //        $reflector = new ReflectionClass($concrete);
        //    } catch (ReflectionException $e) {
        //        throw new BindingResolutionException("Target class [$concrete] does not exist.", 0, $e);
        //    }

        //    // If the type is not instantiable, the developer is attempting to resolve
        //    // an abstract type such as an Interface or Abstract Class and there is
        //    // no binding registered for the abstractions so we need to bail out.
        //    if (! $reflector->isInstantiable()) {
        //        return $this->notInstantiable($concrete);
        //    }

        this.buildStack.push(concrete as ContainerNewable<T>);

        const types: any[] = Reflect.getMetadata('design:paramtypes', concrete) ?? [];

        const dependencies: any[] = (Reflect.getMetadata('design:paramdefinitions', concrete) ?? []).map(
            (definition: ReflectionParameter, index: number) => {
                definition.type = types[index];
                return definition;
            }
        );

        // If there are no constructors parameters, that means there are no dependencies then
        // we can just resolve the instances of the objects right away, without
        // resolving any other types or dependencies out of these containers.
        if (dependencies.length === 0) {
            this.buildStack.pop();
            return new (concrete as ContainerClass<T>)();
        }

        // Once we have all the constructor's parameters we can create each of the
        // dependency instances and then use the reflection instances to make a
        // new instance of this class, injecting the created dependencies in.
        let instances = [];
        try {
            instances = this.resolveDependencies(dependencies);
        } catch (error) {
            if (error instanceof BindingResolutionError) this.buildStack.pop();

            throw error;
        }

        this.buildStack.pop();

        return new (concrete as ContainerClass<T>)(...instances);
    }

    /**
     * Resolve all of the dependencies from the ReflectionParameters.
     */
    protected resolveDependencies(dependencies: ReflectionParameter[]): any[] {
        let results: any[] = [];

        for (const dependency of dependencies) {
            const hasParameterNamedOverride = this.hasParameterNamedOverride(dependency);

            if (hasParameterNamedOverride) {
                results.push(this.getParameterNamedOverride(dependency));
                continue;
            }

            if (!hasParameterNamedOverride && getParameterClass(dependency) === null) {
                if (this.hasParameterArrayOverride(dependency)) {
                    results.push(this.getParameterArrayOverride(dependency));
                    continue;
                }
            }

            const result =
                getParameterClass(dependency) === null
                    ? this.resolvePrimitive(dependency)
                    : this.resolveClass(dependency);

            if (dependency.isVariadic) {
                results = results.concat(result);
            } else {
                results.push(result);
            }
        }

        return results;
    }

    /**
     * Determine if the given dependency has a named parameter override.
     */
    protected hasParameterNamedOverride(dependency: ReflectionParameter): boolean {
        const parameters = this.getLastParameterOverride();
        if (Array.isArray(parameters)) {
            return false;
        }
        return dependency.name in parameters;
    }

    /**
     * Determine if the given dependency has an array parameter override.
     */
    protected hasParameterArrayOverride(dependency: ReflectionParameter): boolean {
        const parameters = this.getLastParameterOverride();
        if (Array.isArray(parameters)) {
            return parameters.length > 0;
        }
        return false;
    }

    /**
     * Get named parameter override for a dependency.
     */
    protected getParameterNamedOverride(dependency: ReflectionParameter): any {
        const parameters = this.getLastParameterOverride() as ContainerKeyValParameters;
        return parameters[dependency.name];
    }

    /**
     * Get array parameter override for a dependency.
     */
    protected getParameterArrayOverride(dependency: ReflectionParameter): any {
        const parameters = this.getLastParameterOverride() as any[];
        return parameters.shift();
    }

    /**
     * Get the last parameter override.
     */
    protected getLastParameterOverride(): ContainerParameters {
        return this.with.length > 0 ? this.with[this.with.length - 1] : {};
    }

    /**
     * Resolve a non-class hinted primitive dependency.
     */
    protected resolvePrimitive(parameter: ReflectionParameter): any {
        const concrete = this.getContextualConcrete(parameter.name);
        if (concrete != null) {
            return unwrapIfClosure(concrete, this);
        }
        if (parameter.hasDefault) {
            // undefined will always be replaced with default value
            return undefined;
        }
        if (parameter.isVariadic) {
            return [];
        }
        throw new BindingResolutionError(
            `Unresolvable dependency resolving [[Parameter #${parameter.index} [ <required> ${parameter.name} ]] in class ${parameter.className}.`
        );
    }

    /**
     * Resolve a class based dependency from the container.
     */
    protected resolveClass(parameter: ReflectionParameter): any {
        try {
            return parameter.isVariadic
                ? this.resolveVariadicClass(parameter)
                : this.make(getParameterClass(parameter));
        } catch (error) {
            // If we can not resolve the class instance, we will check to see if the value
            // is optional, and if it is we will return the optional parameter value as
            // the value of the dependency, similarly to how we do this with scalars.
            if (parameter.hasDefault) {
                this.with.pop();
                // undefined will always be replaced with default value
                return undefined;
            }

            if (parameter.isVariadic) {
                this.with.pop();
                return [];
            }

            throw error;
        }
    }

    /**
     * Resolve a class based variadic dependency from the container.
     */
    protected resolveVariadicClass(parameter: ReflectionParameter): any[] {
        const className = getParameterClass(parameter);

        const abstract = this.getAlias(className);
        const concrete = this.getContextualConcrete(abstract);

        if (!Array.isArray(concrete)) {
            return this.make(className);
        }

        return concrete.map(abstract => {
            return this.resolve(abstract);
        });
    }

    /**
     * Throw an exception that the concrete is not instantiable.
     */
    protected notInstantiable<T>(concrete: ContainerConcrete<T>): BindingResolutionError {
        if (this.buildStack.length > 0) {
            const previous = this.buildStack.map(item => item.name).join(', ');

            return new BindingResolutionError(
                `Target [${concrete.toString()}] is not instantiable while building [${previous}].`
            );
        }
        return new BindingResolutionError(`Target [${concrete.toString()}] is not instantiable.`);
    }

    /**
     * Register a new before resolving callback for all types.
     */
    public beforeResolving(callback: ContainerBeforeResolvingFunction): void;
    public beforeResolving(abstract: ContainerAbstract, callback: ContainerBeforeResolvingFunction): void;
    public beforeResolving(
        abstractOrCallback: ContainerAbstract | ContainerBeforeResolvingFunction,
        callback: ContainerBeforeResolvingFunction | null = null
    ): void {
        if (typeof abstractOrCallback === 'string') {
            abstractOrCallback = this.getAlias(abstractOrCallback);
        }
        if (typeof abstractOrCallback === 'function' && callback === null) {
            this.globalBeforeResolvingCallbacks.push(abstractOrCallback as ContainerBeforeResolvingFunction);
        } else {
            const callbacks =
                (this.beforeResolvingCallbacksMap.get(
                    abstractOrCallback as ContainerAbstract
                ) as ContainerBeforeResolvingFunction[]) ?? [];
            callbacks.push(callback as ContainerBeforeResolvingFunction);
            this.beforeResolvingCallbacksMap.set(abstractOrCallback as ContainerAbstract, callbacks);
        }
    }

    /**
     * Register a new resolving callback.
     */
    public resolving(callback: ContainerResolvingFunction): void;
    public resolving(abstract: ContainerAbstract, callback: ContainerResolvingFunction): void;
    public resolving(
        abstractOrCallback: ContainerAbstract | ContainerResolvingFunction,
        callback: ContainerResolvingFunction | null = null
    ): void {
        if (typeof abstractOrCallback === 'string') {
            abstractOrCallback = this.getAlias(abstractOrCallback);
        }
        if (typeof abstractOrCallback === 'function' && callback === null) {
            this.globalResolvingCallbacks.push(abstractOrCallback as ContainerResolvingFunction);
        } else {
            const callbacks =
                (this.resolvingCallbacksMap.get(
                    abstractOrCallback as ContainerAbstract
                ) as ContainerResolvingFunction[]) ?? [];
            callbacks.push(callback as ContainerResolvingFunction);
            this.resolvingCallbacksMap.set(abstractOrCallback as ContainerAbstract, callbacks);
        }
    }

    /**
     * Register a new after resolving callback for all types.
     */
    public afterResolving(callback: ContainerAfterResolvingFunction): void;
    public afterResolving(abstract: ContainerAbstract, callback: ContainerAfterResolvingFunction): void;
    public afterResolving(
        abstractOrCallback: ContainerAbstract | ContainerAfterResolvingFunction,
        callback: ContainerAfterResolvingFunction | null = null
    ): void {
        if (typeof abstractOrCallback === 'string') {
            abstractOrCallback = this.getAlias(abstractOrCallback);
        }
        if (typeof abstractOrCallback === 'function' && callback === null) {
            this.globalAfterResolvingCallbacks.push(abstractOrCallback as ContainerAfterResolvingFunction);
        } else {
            const callbacks =
                (this.afterResolvingCallbacksMap.get(
                    abstractOrCallback as ContainerAbstract
                ) as ContainerAfterResolvingFunction[]) ?? [];
            callbacks.push(callback as ContainerAfterResolvingFunction);
            this.afterResolvingCallbacksMap.set(abstractOrCallback as ContainerAbstract, callbacks);
        }
    }

    /**
     * Fire all of the before resolving callbacks.
     */
    protected fireBeforeResolvingCallbacks(abstract: ContainerAbstract, parameters: ContainerParameters): void {
        this.fireBeforeCallbackArray(abstract, parameters, this.globalBeforeResolvingCallbacks);
        for (const [abs, callbacks] of this.beforeResolvingCallbacksMap) {
            if (
                abstract === abs ||
                (typeof abstract === 'function' && typeof abs === 'function' && abstract.prototype instanceof abs) ||
                (typeof abs === 'string' &&
                    typeof abstract === 'function' &&
                    ((Reflect.getMetadata('design:interfaces', abstract) ?? []) as string[]).includes(abs))
            ) {
                this.fireBeforeCallbackArray(abstract, parameters, callbacks);
            }
        }
    }

    /**
     * Fire an array of callbacks with an object.
     */
    protected fireBeforeCallbackArray(
        abstract: ContainerAbstract,
        parameters: ContainerParameters,
        callbacks: ContainerBeforeResolvingFunction[]
    ): void {
        for (const fnToCall of callbacks) {
            fnToCall(abstract, parameters, this);
        }
    }

    /**
     * Fire all of the resolving callbacks.
     */
    protected fireResolvingCallbacks(abstract: ContainerAbstract, obj: any): void {
        this.fireCallbackArray(obj, this.globalResolvingCallbacks);
        this.fireCallbackArray(obj, this.getCallbacksForType(abstract, obj, this.resolvingCallbacksMap));
        this.fireAfterResolvingCallbacks(abstract, obj);
    }

    /**
      * Fire all of the after resolving callbacks.

      */
    protected fireAfterResolvingCallbacks(abstract: ContainerAbstract, obj: any): void {
        this.fireCallbackArray(obj, this.globalAfterResolvingCallbacks);
        this.fireCallbackArray(obj, this.getCallbacksForType(abstract, obj, this.afterResolvingCallbacksMap));
    }

    /**
     * Get all callbacks for a given type.
     */
    protected getCallbacksForType(
        abstract: ContainerAbstract,
        obj: any,
        callbacksPerType: ResolvingMap | AfterResolvingMap
    ): ContainerResolvingFunction[] | ContainerAfterResolvingFunction[] {
        let results: ContainerResolvingFunction[] = [];
        for (const [abs, callbacks] of callbacksPerType) {
            if (
                abstract === abs ||
                (typeof abs === 'function' && obj instanceof abs) ||
                (typeof abs === 'string' &&
                    ((Reflect.getMetadata('design:interfaces', obj.constructor) ?? []) as string[]).includes(abs))
            ) {
                results = results.concat(callbacks);
            }
        }

        return results;
    }

    /**
     * Fire an array of callbacks with an object.
     */
    protected fireCallbackArray(
        object: any,
        callbacks: ContainerResolvingFunction[] | ContainerAfterResolvingFunction[]
    ): void {
        for (const fnToCall of callbacks) {
            fnToCall(object, this);
        }
    }

    /**
     * set a value with the container.
     */
    public set<T>(abstract: string, value: any): void {
        this.bind<T>(abstract, typeof value === 'function' ? value : () => value);
    }

    /**
     * Get the container's bindings.
     */
    public getBindings(): Map<ContainerAbstract, ContainerBinding> {
        return this.bindingsMap;
    }

    /**
     * Get the alias for an abstract if available.
     */
    public getAlias<T>(abstract: ContainerAbstract<T>): ContainerAbstract<T> {
        return this.aliasesMap.has(abstract) ? this.getAlias(this.aliasesMap.get(abstract)) : abstract;
    }

    /**
     * Get the extender callbacks for a given type.
     */
    protected getExtenders(abstract: ContainerAbstract): ContainerExtendFunction[] {
        return this.extendersMap.get(this.getAlias(abstract)) ?? [];
    }

    /**
     * Remove all of the extender callbacks for a given type.
     */
    public forgetExtenders(abstract: ContainerAbstract): void {
        this.extendersMap.delete(this.getAlias(abstract));
    }

    /**
     * Drop all of the stale instances and aliases.
     */
    protected dropStaleInstances(abstract: ContainerAbstract): void {
        this.instancesMap.delete(abstract);
        this.aliasesMap.delete(abstract);
    }

    /**
     * Remove a resolved instance from the instance cache.
     */
    public forgetInstance(abstract: ContainerAbstract): void {
        this.instancesMap.delete(abstract);
    }

    /**
     * Clear all of the instances from the container.
     */
    public forgetInstances(): void {
        this.instancesMap = new Map();
    }

    /**
     * Clear all of the scoped instances from the container.
     */
    public forgetScopedInstances(): void {
        for (const scoped of this.scopedInstancesSet.values()) {
            this.instancesMap.delete(scoped);
        }
    }

    /**
     * Flush the container of all bindings and resolved instances.
     */
    public flush(): void {
        this.aliasesMap = new Map();
        this.resolvedMap = new Map();
        this.bindingsMap = new Map();
        this.instancesMap = new Map();
        this.abstractAliasesMap = new Map();
        this.scopedInstancesSet = new Set();
    }

    /**
     * Get the globally available instance of the container.
     */
    public static getInstance(): ContainerContract {
        if (this.instance == null) {
            this.instance = new this();
        }

        return this.instance;
    }

    /**
     * Set the shared instance of the container.
     */
    public static setInstance(container: ContainerContract | null = null): ContainerContract | null {
        this.instance = container;
        return this.instance;
    }
}

export = Container;
