# lucontainer

> Lucontainer offers an (almost) identical api to [Laravel Container](https://laravel.com/docs/container).

-   [Installation](#installation)
-   [Introduction](#introduction)
-   [Zero Configuration Resolution](#zero-configuration-resolution)
-   [Binding](#binding)
    -   [Binding Basics](#binding-basics)
    -   [Binding Names To Implementations](#binding-names-to-implementations)
    -   [Contextual Binding](#contextual-binding)
    -   [Binding Primitives](#binding-primitives)
    -   [Binding Typed Variadics](#binding-typed-variadics)
    -   [Tagging](#tagging)
    -   [Extending Bindings](#extending-bindings)
-   [Resolving](#resolving)
    -   [The Make Method](#the-make-method)
-   [Method Invocation & Injection](#method-invocation-&-injection)
-   [Container Events](#container-events)
-   [Decorators](#decorators)

# Installation

> npm install lucontainer reflect-metadata

The Lucontainer type definitions are included in the lucontainer npm package.

> **Warning**
> If You Use Typescript Lucontainer requires TypeScript >= 4.4 and the experimentalDecorators, emitDecoratorMetadata options in your tsconfig.json file.

```json
{
    "compilerOptions": {
        "types": ["reflect-metadata"],
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true
    }
}
```

Lucontainer requires a modern JavaScript engine with support for:

-   [Reflect metadata](https://rbuckton.github.io/reflect-metadata)
-   [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
-   [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)

> **Warning**
> **The `reflect-metadata` polyfill should be imported only once in your entire application** because the Reflect object is meant to be a global singleton.

# Introduction

The Lucontainer service container is a powerful tool for managing class dependencies and performing dependency injection. Dependency injection is a fancy phrase that essentially means this: class dependencies are "injected" into the class via the constructor or, in some cases, "setter" methods.

Let's look at a simple example:

```ts
import UserRepository from 'user-repository';
import { constructable } from 'lucontainer';

@constructable()
class UserController {
    constructor(protected users: UserRepository) {}

    public show(id: number): User {
        return this.users.find(id);
    }
}
```

In this example, the `UserController` needs to retrieve users from a data source. So, we will inject a service that is able to retrieve users. In this context, our `UserRepository` to retrieve user information from the database. However, since the repository is injected, we are able to easily swap it out with another implementation. We are also able to easily "mock", or create a dummy implementation of the `UserRepository` when testing our application.

A deep understanding of the Lucontainer service container is essential to building a powerful, large application, as well as for contributing to the Lucontainer core itself.

## Zero Configuration Resolution

If a class has no dependencies or only depends on other concrete classes (not interfaces), the container does not need to be instructed on how to resolve that class. For example:

```ts
import { Container, constructable } from './src';

@constructable()
class Service {
    //
}

@constructable()
class UsingService {
    constructor(protected service: Service) {}
}

const container = new Container();
console.log(container.get(UsingService));
```

# Binding

## Binding Basics

### Simple Bindings

We can register a binding using the `bind` method, passing the class or a name (you can't bind Typescript Interfaces) that we wish to register along with a closure that returns an instance of the class:

```ts
import Transistor from './services/transistor';
import PodcastParser from './services/podcast-parser';

container.bind(Transistor, function (app) {
    return new Transistor(app.make(PodcastParser));
});
```

Note that we receive the container itself as an argument to the resolver. We can then use the container to resolve sub-dependencies of the object we are building.

> **Note**
> There is no need to bind classes into the container if they do not depend on any interfaces. The container does not need to be instructed on how to build these objects, since it can automatically resolve these objects using reflection.

### Binding A Singleton

The `singleton` method binds a class or a name (you can't bind Typescript Interfaces) into the container that should only be resolved one time. Once a singleton binding is resolved, the same object instance will be returned on subsequent calls into the container:

```ts
import Transistor from './services/transistor';
import PodcastParser from './services/podcast-parser';

container.singleton(Transistor, function (app) {
    return new Transistor(app.make(PodcastParser));
});
```

### Binding Scoped Singletons

The `scoped` method binds a class or a name (you can't bind Typescript Interfaces) into the container that should only be resolved one time within a given request / job lifecycle. While this method is similar to the singleton method, instances registered using the scoped method should be dafely flushed whenever the application starts a new "lifecycle", such as your application receive a `new request` or a worker processes a `new job`:

```ts
import Transistor from './services/transistor';
import PodcastParser from './services/podcast-parser';

container.scoped(Transistor, function (app) {
    return new Transistor(app.make(PodcastParser));
});
```

### Binding Instances

You may also bind an existing object instance into the container using the `instance` method. The given instance will always be returned on subsequent calls into the container:

```ts
import Transistor from './services/transistor';
import PodcastParser from './services/podcast-parser';

container.instance(Transistor, function (app) {
    return new Transistor(app.make(PodcastParser));
});
```

## Binding Names To Implementations

> **Note**
> Interfaces Workaround
> A very powerful feature of the service container is its ability to bind a name (you can't bind Typescript Interfaces) to a given implementation. For example, let's assume we have an `EventPusher` interface and a `RedisEventPusher` implementation. Once we have coded our `RedisEventPusher` implementation of this interface, we can register it with the service container like so:

```ts
import { constructable } from './src';
interface EventPusher {}

@constructable()
class RedisEventPusher implements EventPusher {}

container.bind('EventPusher', RedisEventPusher);
container.bind(Symbol.for('EventPusher'), RedisEventPusher);
```

This statement tells the container that it should inject the `RedisEventPusher` when a class needs an implementation of `EventPusher`. Now we can type-hint the `EventPusher` interface in the constructor of a class that is resolved by the container:

```ts
import { constructable, inject } from './src';
interface EventPusher {}

@constructable()
class Test {
    constructor(@inject(Symbol.for('EventPusher')) public pusher: EventPusher) {}
}

@constructable()
class Test2 {
    constructor(@inject('EventPusher') public pusher: EventPusher) {}
}
```

> **Note**
> Named Binding cannot be Automatically Injected, you need to add @inject parameter decorator, in this way type of parameter will respect the original interface and the container can automatically inject the registered implementations.

## Contextual Binding

Sometimes you may have two classes that utilize the same interface, but you wish to inject different implementations into each class. For example, two controllers may depend on different implementations of the `Filesystem` contract:

```ts
import PhotoController from './service/photo-controller';
import UploadController from './service/upload-controller';
import VideoController from './service/video-controller';

container
    .when(PhotoController)
    .needs('FileSystem')
    .give(function () {
        return 'local';
    });

container
    .when([VideoController, UploadController])
    .needs('FileSystem')
    .give(function () {
        return 'cloud';
    });
```

## Binding Primitives

Sometimes you may have a class that receives some injected classes, but also needs an injected primitive value such as an integer. You may easily use contextual binding to inject any value your class may need:

```ts
import UserController from './service/user-controller';

container.when(UserController).needs('parameterName').give(10);
```

Sometimes a class may depend on an array of [tagged](#tagging) instances. Using the `giveTagged` method, you may easily inject all of the container bindings with that tag:

```ts
import ReportAggregator from './service/report-aggregator';

container.when(ReportAggregator).needs('reports').giveTagged('reports');
```

If you need to inject a value from one of your application's configuration files, you may use the `giveConfig` method:

```ts
import ReportAggregator from './service/report-aggregator';

container.when(ReportAggregator).needs('timezone').giveConfig('app.timezone');
```

## Binding Typed Variadics

Occasionally, you may have a class that receives an array of typed objects using a variadic constructor argument:

```ts
import Filter from './models/filter';
import Logger from './services/logger';

@constructable()
class Firewall {
    constructor(protected logger: Logger, protected ...filters: Filter[]) {}
}
```

Using contextual binding, you may resolve this dependency by providing the `give` method with a closure that returns an array of resolved `Filter` instances:

```ts
container
    .when(Firewall)
    .needs(Filter)
    .give(function (app) {
        return [app.make(NullFilter), app.make(ProfanityFilter), app.make(TooLongFilter)];
    });
```

For convenience, you may also just provide an array of class names to be resolved by the container whenever `Firewall` needs `Filter` instances:

```ts
container.when(Firewall).needs(Filter).give([NullFilter, ProfanityFilter, TooLongFilter]);
```

### Variadic Tag Dependencies

Sometimes a class may have a variadic dependency that is type-hinted as a given class `(...reports: Report[])`. Using the `needs` and `giveTagged` methods, you may easily inject all of the container bindings with that [tag](#tagging) for the given dependency:

```ts
container.when(ReportAggregator).needs(Report).giveTagged('reports');
```

## Tagging

Occasionally, you may need to resolve all of a certain "category" of binding. For example, perhaps you are building a report analyzer that receives an array of many different `Report` interface implementations. After registering the `Report` implementations, you can assign them a tag using the `tag` method:

```ts
container.bind(CpuReport, function () {
    //
});

container.bind(MemoryReport, function () {
    //
});

container.tag([CpuReport, MemoryReport], 'reports');
```

Once the services have been tagged, you may easily resolve them all via the container's `tagged` method:

```ts
import ReportAnalyzer from './services/report-analyzer';
container.bind(ReportAnalyzer, function (app) {
    return new ReportAnalyzer(app.tagged('reports'));
});
```

## Extending Bindings

The `extend` method allows the modification of resolved services. For example, when a service is resolved, you may run additional code to decorate or configure the service. The `extend` method accepts two arguments, the service class you're extending and a closure that should return the modified service. The closure receives the service being resolved and the container instance:

```ts
container.extend(Service, function (service: Service, app: Container) {
    return new DecoratedService(service);
});
```

# Resolving

## The make Method

You may use the `make` method to resolve a class instance from the container. The `make` method accepts a class or a name (you can't bind Typescript Interfaces) you wish to resolve:

```ts
import Transistor from './services/transistor';

const transistor = container.make(Transistor);
```

If some of your class' dependencies are not resolvable via the container, you may inject them by passing them as a key-value object into the `makeWith` method. For example, we may manually pass the `id` constructor argument required by the `Transistor` service:

```ts
import Transistor from './services/transistor';

const transistor = container.makeWith(Transistor, { id: 1 });
```

If you would like to have the Lucontainer instance itself injected into a class that is being resolved by the container, you can register an instance and type-hint the `Container` class on your class' constructor:

```ts
import Container from 'lucontainer';

const container = new Container();
container.instance(Container, container);

@constructable()
class Test {
    constructor(protected container: Container) {}
}
```

# Method Invocation & Injection

Sometimes you may wish to invoke a method on an object instance while allowing the container to automatically inject that method's dependencies. For example, given the following class:

```ts
import { constructable, methodable } from 'lucontainer';
import UserRepository from 'user-repository';

@constructable()
class UserReport {
    @methodable()
    public generate(repository: UserRepository) {
        // ...
    }
}
```

You may invoke the `generate` method via the container like so:

```ts
import UserReport from 'user-report';

const report = container.call([new UserReport(), 'generate']);
```

The `call` method accepts an array of [class | instance, method, static (true|false)].
The container's call method may even be used to invoke an [annotated](#annotate) closure while automatically injecting its dependencies:

```ts
import { annotate } from 'lucontainer';
import UserRepository from 'user-repository';

function toCall(repository: UserRepository) {}

annotate(toCall, [], [UserRepository]);

const result = container.call(toCall);
```

# Container Events

The service container fires an event each time it resolves an object. You may listen to this event using the `resolving`, `beforeResolving`,`AfterResolving` method:

```ts
import Transistor from './services/transistor';

container.beforeResolving(
    Transistor,
    function (transistor: Transistor, parameters: ContainerParameters, app: container) {
        // Called before container resolves objects of type "Transistor"...
    }
);

container.resolving(Transistor, function (transistor: Transistor, app: container) {
    // Called when container resolves objects of type "Transistor"...
});

container.afterResolving(Transistor, function (transistor: Transistor, app: container) {
    // Called after container resolves objects of type "Transistor"...
});

container.beforeResolving(function (transistor: Transistor, parameters: ContainerParameters, app: container) {
    // Called before container resolves object of any type...
});

container.resolving(function (transistor: Transistor, app: container) {
    // Called when container resolves object of any type...
});

container.afterResolving(function (transistor: Transistor, app: container) {
    // Called after container resolves object of any type...
});
```

As you can see, the object being resolved will be passed to the callback, allowing you to set any additional properties on the object before it is given to its consum

# Decorators

Every Class or Function Resolved By Lucontainer need to be decorated

## Typescript

### Constructable

Decorate Class with `Constructable` in order to be resolved by Lucontainer

```ts
import { constructable } from 'lucontainer';

@constructable()
class Test {}
```

Because Typescript Interfaces are not compiled to javascript, you can pass a list of [Named implementation](#binding-names-to-implementations), in order to raise implementations events

```ts
import { Container, constructable } from 'lucontainer';

interface ResolvingContractStub {
    //
}

@constructable(Symbol.for('ResolvingContractStub'))
class ResolvingImplementationStub implements ResolvingContractStub {
    //
}

@constructable()
class ResolvingImplementationStubTwo implements ResolvingContractStub {
    //
}

const container = new Container();
let callCounter = 0;
container.resolving(Symbol.for('ResolvingContractStub'), () => {
    callCounter++;
});

container.bind(Symbol.for('ResolvingContractStub'), ResolvingImplementationStub);
container.make(ResolvingImplementationStub);
console.log(callCounter); // 1

container.bind(Symbol.for('ResolvingContractStub'), ResolvingImplementationStubTwo);
container.make(ResolvingImplementationStubTwo);
console.log(callCounter); // 1
```

### Methodable

Decorate Class methods with `Methodable` in order to be called by Lucontainer

```ts
import { constructable, methodable } from 'lucontainer';

@constructable()
class Test {
    @methodable()
    public inject(bar: number = 1) {}

    @methodable()
    public static inject(bar: number = 1) {}
}
```

### Inject

Decorate Class Method Parameters in order to resolve Named Parameters within Lucontainer.

```ts
import { Container, constructable, methodable, inject } from 'lucontainer';

interface IContainerContractStub {
    //
}

@constructable()
class ContainerImplementationStub implements IContainerContractStub {
    //
}

@constructable()
class ContainerImplementationStubTwo implements IContainerContractStub {
    //
}

@constructable()
class ContainerDependentStub {
    public constructor(@inject('IContainerContractStub') public impl: IContainerContractStub) {}

    @methodable()
    public setImplementation(@inject('IContainerContractStub') impl: IContainerContractStub) {
        this.impl = impl;
    }
}

const container = new Container();
container.bind('IContainerContractStub', ContainerImplementationStub);
const obj = container.make(ContainerDependentStub);
console.log(obj.impl instanceof ContainerImplementationStub); // true
container.bind('IContainerContractStub', ContainerImplementationStubTwo);
container.call([obj, 'setImplementation']);
console.log(obj.impl instanceof ContainerImplementationStubTwo); // true
```

## Javascript

### Annotate

Decorate Class And Function with `annotate` Function in order to be resolved by Lucontainer.

> **Note**
> @decorator in Typescript can not be used to decorate function, you must use annotate.

Class or Function Constructor:

```js
import { Container, annotate } from 'lucontainer';

// const {Container, annotate} = require('lucontainer');

class ContainerImplementationStub {
    //
}

annotate(ContainerImplementationStub, [], []);

class ContainerImplementationStubTwo {
    //
}

annotate(ContainerImplementationStubTwo, [], []);

function ContainerDependentStub(impl, number = 10) {
    this.impl = impl;
    this.number = 10;
}

ContainerDependentStub.prototype.setImplementation = function (impl) {
    this.impl = impl;
};

// annotate constructor (Fn or Class, array of implementations, array of parameters Types)
annotate(ContainerDependentStub, [Symbol.for('ResolvingContractStub')], [Symbol.for('IContainerContractStub'), Number]);

// annotate method (Fn or Class or prototype, method name, array of parameters Types)
annotate(ContainerDependentStub.prototype, 'setImplementation', [Symbol.for('IContainerContractStub')]);

const container = new Container();
let callCounter = 0;
container.bind(Symbol.for('ResolvingContractStub'), ContainerDependentStub);
container.resolving(Symbol.for('ResolvingContractStub'), () => {
    callCounter++;
});

container.bind(Symbol.for('IContainerContractStub'), ContainerImplementationStub);
const obj = container.make(ContainerDependentStub);

console.log(obj.impl instanceof ContainerImplementationStub); // true

container.bind(Symbol.for('IContainerContractStub'), ContainerImplementationStubTwo);
container.call([obj, 'setImplementation']);

console.log(obj.impl instanceof ContainerImplementationStubTwo); // true

console.log(callCounter); // 1
container.make(ContainerDependentStub);
console.log(callCounter); // 2
```
