/* eslint-disable @typescript-eslint/no-empty-interface */

import Container from '../../container';
import { constructable, inject } from '../../decorators';
import CircularAStub from '../fixtures/circular-a-stub';

@constructable()
class ContainerConcreteStub {
    //
}

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
    public constructor(@inject(Symbol.for('IContainerContractStub')) public impl: IContainerContractStub) {}
}

@constructable()
class ContainerNestedDependentStub {
    public constructor(public inner: ContainerDependentStub) {}
}

@constructable()
class ContainerDefaultValueStub {
    public constructor(public stub: ContainerConcreteStub, public defaultValue: string = 'claudio') {}
}

@constructable()
class ContainerMixedPrimitiveStub {
    public constructor(public first: any, public stub: ContainerConcreteStub, public last: any) {}
}

@constructable()
class ContainerInjectVariableStubWithInterfaceImplementation implements IContainerContractStub {
    public constructor(public concrete: ContainerConcreteStub, public something: any) {}
}

@constructable()
class Refreshable {
    constructor(@inject(Symbol.for('IContainerContractStub')) public concrete: IContainerContractStub) {}
    public setConcrete(concrete: IContainerContractStub): this {
        this.concrete = concrete;
        return this;
    }
}

describe('Container', () => {
    afterEach(() => {
        // restore the spy created with spyOn
        Container.setInstance(null);
    });

    it('Works Singleton', () => {
        const container = Container.setInstance(new Container());
        Container.setInstance();
        const container2 = Container.getInstance();
        expect(container2).toBeInstanceOf(Container);
        expect(container === container2).toBeFalsy();
        const container3 = Container.getInstance();
        expect(container3 === container2).toBeTruthy();
    });

    it('Works Closure Resolution', () => {
        const container = new Container();
        container.bind('name', () => {
            return 'Claudio';
        });
        expect(container.make('name')).toBe('Claudio');
    });

    it('Works BindIf Doesnt Register If Service Already Registered', () => {
        const container = new Container();

        container.bind('name', () => {
            return 'Claudio';
        });

        container.bindIf('name', () => {
            return 'Alberto';
        });

        expect(container.make('name')).toBe('Claudio');

        container.bind(ContainerConcreteStub, ContainerImplementationStub);
        container.bindIf(ContainerConcreteStub);

        expect(container.make(ContainerConcreteStub)).toBeInstanceOf(ContainerImplementationStub);
    });

    it('Works BindIf Does Register If Service Not Registered Yet', () => {
        const container = new Container();

        container.bind('surname', () => {
            return 'Claudio';
        });

        container.bindIf('name', () => {
            return 'Alberto';
        });

        expect(container.make('name')).toBe('Alberto');

        container.bindIf(ContainerConcreteStub);
        expect(container.make(ContainerConcreteStub)).toBeInstanceOf(ContainerConcreteStub);
    });

    it('Works SingletonIf Doesnt Register If Binding Already Registered', () => {
        const container = new Container();

        container.singleton('name', () => {
            return 'Claudio';
        });

        container.singletonIf('name', () => {
            return 'Alberto';
        });

        expect(container.make('name')).toBe('Claudio');

        container.singleton(ContainerConcreteStub, ContainerImplementationStub);
        container.singletonIf(ContainerConcreteStub);

        expect(container.make(ContainerConcreteStub)).toBeInstanceOf(ContainerImplementationStub);
    });

    it('Works SingletonIf Does Register If Binding Not Registered Yet', () => {
        const container = new Container();

        container.singleton('class', () => {
            return new (class {})();
        });
        container.singletonIf('otherClass', () => {
            return new ContainerConcreteStub();
        });
        const firstInstantiation = container.make('otherClass');
        const secondInstantiation = container.make('otherClass');
        expect(firstInstantiation === secondInstantiation).toBeTruthy();

        container.singletonIf(ContainerConcreteStub);
        expect(container.make(ContainerConcreteStub)).toBeInstanceOf(ContainerConcreteStub);
    });

    it('Works Shared Closure Resolution', () => {
        const container = new Container();

        container.singleton('class', () => {
            return new (class {})();
        });
        const firstInstantiation = container.make('class');
        const secondInstantiation = container.make('class');
        expect(firstInstantiation === secondInstantiation).toBeTruthy();
    });

    it('Works Scoped Closure Resolution', () => {
        const container = new Container();

        container.scoped('class', () => {
            return new (class {})();
        });

        container.scoped('class', () => {
            return new (class {})();
        });

        const firstInstantiation = container.make('class');
        const secondInstantiation = container.make('class');
        expect(firstInstantiation === secondInstantiation).toBeTruthy();
    });

    it('Works ScopedIf', () => {
        const container = new Container();

        container.scopedIf('class', () => {
            return 'foo';
        });
        expect(container.make('class')).toBe('foo');

        container.scopedIf('class', () => {
            return 'bar';
        });

        expect(container.make('class') === container.make('class')).toBeTruthy();
        expect(container.make('class')).not.toBe('bar');

        container.scopedIf(ContainerConcreteStub, ContainerImplementationStub);
        container.scopedIf(ContainerConcreteStub);

        expect(container.make(ContainerConcreteStub) === container.make(ContainerConcreteStub)).toBeTruthy();
        expect(container.make(ContainerConcreteStub)).toBeInstanceOf(ContainerImplementationStub);
    });

    it('Works Scoped Closure Resets', () => {
        const container = new Container();

        container.scoped('class', () => {
            return new (class {})();
        });

        const firstInstantiation = container.make('class');

        container.forgetScopedInstances();

        const secondInstantiation = container.make('class');

        expect(firstInstantiation === secondInstantiation).toBeFalsy();
    });

    it('Works Auto Concrete Resolution', () => {
        const container = new Container();

        expect(container.make(ContainerConcreteStub)).toBeInstanceOf(ContainerConcreteStub);
    });

    it('Works Shared Concrete Resolution', () => {
        const container = new Container();
        container.singleton(ContainerConcreteStub);
        const first = container.make(ContainerConcreteStub);
        const second = container.make(ContainerConcreteStub);
        expect(first === second).toBeTruthy();
    });

    it('Works Scoped Concrete Resolution Reset', () => {
        const container = new Container();
        container.scoped(ContainerConcreteStub);
        const first = container.make(ContainerConcreteStub);
        container.forgetScopedInstances();
        const second = container.make(ContainerConcreteStub);
        expect(first === second).toBeFalsy();
    });

    it('Bind Fails Loudly With Invalid Argument', () => {
        const container = new Container();
        const concrete = new ContainerConcreteStub();
        expect(() => {
            // @ts-expect-error test error on concrete
            container.bind(ContainerConcreteStub, concrete);
        }).toThrowError('concrete should be a closure or a class, "object" given');

        expect(() => {
            container.bind(Symbol.for('IContainerContractStub'));
        }).toThrowError('please provide a concrete for abstract Symbol(IContainerContractStub)');
    });

    it('Works Abstract To Concrete Resolution', () => {
        const container = new Container();
        container.bind(Symbol.for('IContainerContractStub'), ContainerImplementationStub);
        const obj = container.make(ContainerDependentStub);
        expect(obj.impl).toBeInstanceOf(ContainerImplementationStub);
    });

    it('Works Nested Dependency Resolution', () => {
        const container = new Container();
        container.bind(Symbol.for('IContainerContractStub'), ContainerImplementationStub);
        const obj = container.make(ContainerNestedDependentStub);
        expect(obj.inner).toBeInstanceOf(ContainerDependentStub);
        expect(obj.inner.impl).toBeInstanceOf(ContainerImplementationStub);
    });

    it('Works Container Is Passed To Resolvers', () => {
        const container = new Container();
        container.bind('something', ({ container }) => {
            return container;
        });
        const c = container.make<Container>('something');

        expect(c === container).toBeTruthy();
    });

    it('Works Proxy Handlers', () => {
        let container = new Container() as Container & { [key: string | symbol]: any };
        expect(Symbol.for('something') in container).toBeFalsy();
        container[Symbol.for('something')] = () => {
            return 'foo';
        };
        expect(Symbol.for('something') in container).toBeTruthy();
        expect(container.get(Symbol.for('something'))).toBe('foo');
        expect(container[Symbol.for('something')]).not.toBeUndefined();
        delete container[Symbol.for('something')];
        expect(Symbol.for('something') in container).toBeFalsy();

        //test proxy set when it's not a closure
        container = new Container() as Container & { [key: string]: any };
        container.something = 'text';
        expect('something' in container).toBeTruthy();
        expect(container.something).not.toBeUndefined();
        expect(container.something).toBe('text');
        delete container.something;
        expect('something' in container).toBeFalsy();

        container.toJSON = () => {
            return 'toJSON isReserved it does not register a binding';
        };
        expect('toJSON' in container).toBeTruthy();
        expect(container.toJSON).not.toBe('toJSON isReserved it does not register a binding');
        expect(JSON.stringify(container)).toBe('"toJSON isReserved it does not register a binding"');
    });

    it('Works Aliases', () => {
        const container = new Container() as Container & { [key: string]: any };
        container.foo = 'bar';
        container.alias('foo', 'baz');
        container.alias('baz', 'bat');
        expect(container.make('foo') === 'bar').toBeTruthy();
        expect(container.make('baz') === 'bar').toBeTruthy();
        expect(container.make('bat') === 'bar').toBeTruthy();
    });

    it('Aliases Fails Loudly With Invalid Arguments', () => {
        const container = new Container() as Container & { [key: string]: any };
        container.foo = 'bar';
        expect(() => {
            container.alias('foo', 'foo');
        }).toThrowError('[foo] is aliased to itself');

        container.bind(ContainerConcreteStub);

        expect(() => {
            container.alias(ContainerConcreteStub, ContainerConcreteStub);
        }).toThrowError('[ContainerConcreteStub] is aliased to itself');
    });

    it('Works Aliases With Array Of Parameters', () => {
        const container = new Container();

        container.bind('foo', ({ parameters }) => {
            return parameters;
        });
        container.alias('foo', 'baz');

        expect(container.make<number[]>('baz', [1, 2, 3])).toEqual([1, 2, 3]);

        @constructable()
        class Test {
            constructor(
                public a: number,
                public b: number,
                public c: number,
                @inject('NotValidBinding') public d: number = 4
            ) {}
        }

        const resolved = container.make(Test, [1, 2, 3]);
        expect(resolved.a).toBe(1);
        expect(resolved.b).toBe(2);
        expect(resolved.c).toBe(3);
        // because has default it doesn't throw an error even if 'NotValidBinding' doesn't exists
        expect(resolved.d).toBe(4);
    });

    it('Works Bindings Can Be Overriden', () => {
        const container = new Container() as Container & { [key: string]: any };

        container.foo = 'bar';
        container.foo = 'baz';

        expect(container.foo).toBe('baz');
    });

    it('Works Binding An Instance Returns The Instance', () => {
        const container = new Container();

        const bound = new (class {})();
        const resolved = container.instance('foo', bound);

        expect(resolved === bound).toBeTruthy();
    });

    it('Works Binding An Instance As Shared', () => {
        const container = new Container();

        const bound = new (class {})();
        container.instance('foo', bound);
        const obj = container.make('foo');

        expect(obj === bound).toBeTruthy();
    });

    it('Works Binding An Existing Instance Remove Aliases', () => {
        const container = new Container();

        const bound = new (class {})();
        container.instance('test', bound);
        container.alias('test', 'foo');
        container.alias('foo', 'bar');

        let obj = container.make('test');
        expect(obj === bound).toBeTruthy();
        obj = container.make('foo');
        expect(obj === bound).toBeTruthy();
        obj = container.make('bar');
        expect(obj === bound).toBeTruthy();

        const rebound = new (class {})();
        container.instance('foo', rebound);

        obj = container.make('test');
        expect(bound === obj).toBeTruthy();
        obj = container.make('foo');
        expect(bound === obj).toBeFalsy();
        expect(rebound === obj).toBeTruthy();
        obj = container.make('bar');
        expect(obj === rebound).toBeTruthy();
    });

    it('Works Resolution Of Default Parameters', () => {
        const container = new Container();
        const instance = container.make(ContainerDefaultValueStub);
        expect(instance.stub).toBeInstanceOf(ContainerConcreteStub);
        expect(instance.defaultValue).toBe('claudio');
    });

    it('Works Bound', () => {
        let container = new Container();
        container.bind(ContainerConcreteStub, () => {
            return undefined;
        });
        expect(container.bound(ContainerConcreteStub)).toBeTruthy();
        expect(container.bound(Symbol.for('IContainerContractStub'))).toBeFalsy();

        container = new Container();
        container.bind(Symbol.for('IContainerContractStub'), ContainerConcreteStub);
        expect(container.bound(Symbol.for('IContainerContractStub'))).toBeTruthy();
        expect(container.bound(ContainerConcreteStub)).toBeFalsy();
    });

    it('Works Proxy Delete Remove Bound Instances', () => {
        const container = new Container() as Container & { [key: string]: any };
        container.instance('object', new (class {})());
        delete container.object;

        expect(container.bound('object')).toBeFalsy();
    });

    it('Works Bound Instance And Alias Check Via Proxy', () => {
        const container = new Container() as Container & { [key: string]: any };
        container.instance('object', new (class {})());
        container.alias('object', 'alias');
        expect('object' in container).toBeTruthy();
        expect('alias' in container).toBeTruthy();
    });

    it('Works Rebound Listeners', () => {
        let rebind = false;
        const container = new Container();
        container.bind('foo', () => {
            return undefined;
        });
        container.rebinding('foo', () => {
            rebind = true;
        });
        container.bind('foo', () => {
            return undefined;
        });
        expect(rebind).toBeTruthy();
    });

    it('Works Rebound Listeners On Instances', () => {
        let rebind = false;
        const container = new Container();
        container.bind('foo', () => {
            return undefined;
        });
        container.rebinding('foo', () => {
            rebind = true;
        });
        container.instance('foo', () => {
            return undefined;
        });
        expect(rebind).toBeTruthy();
    });

    it('Works Rebound Listeners On Instances Only Fires If Was Already Bound', () => {
        let rebind = false;
        const container = new Container();

        container.rebinding('foo', () => {
            rebind = true;
        });
        container.instance('foo', () => {
            return undefined;
        });
        expect(rebind).toBeFalsy();
    });

    it('Works Internal Class With Default Parameters', () => {
        const container = new Container();
        expect(() => {
            container.make(ContainerMixedPrimitiveStub);
        }).toThrowError(
            'Unresolvable dependency resolving [[Parameter #0 [ <required> first ]] in class ContainerMixedPrimitiveStub'
        );
    });

    it('Throw Binding Resolution Error Message', () => {
        const container = new Container();
        expect(() => {
            container.make(Symbol.for('IContainerContractStub'));
        }).toThrowError('Target [Symbol(IContainerContractStub)] is not instantiable.');
    });

    it('Throw Binding Resolution Error Message Includes Build Stack', () => {
        const container = new Container();
        expect(() => {
            container.make(ContainerDependentStub);
        }).toThrowError(
            'Target [Symbol(IContainerContractStub)] is not instantiable while building [ContainerDependentStub].'
        );
    });

    it('ForgetInstance Forgets Instance', () => {
        const container = new Container();
        const containerConcreteStub = new ContainerConcreteStub();
        container.instance(ContainerConcreteStub, containerConcreteStub);
        expect(container.isShared(ContainerConcreteStub)).toBeTruthy();
        container.forgetInstance(ContainerConcreteStub);
        expect(container.isShared(ContainerConcreteStub)).toBeFalsy();
    });

    it('ForgetInstances Forgets All Instances', () => {
        const container = new Container();
        const containerConcreteStub1 = new ContainerConcreteStub();
        const containerConcreteStub2 = new ContainerConcreteStub();
        const containerConcreteStub3 = new ContainerConcreteStub();
        container.instance('Instance1', containerConcreteStub1);
        container.instance('Instance2', containerConcreteStub2);
        container.instance('Instance3', containerConcreteStub3);
        expect(container.isShared('Instance1')).toBeTruthy();
        expect(container.isShared('Instance2')).toBeTruthy();
        expect(container.isShared('Instance3')).toBeTruthy();
        container.forgetInstances();
        expect(container.isShared('Instance1')).toBeFalsy();
        expect(container.isShared('Instance2')).toBeFalsy();
        expect(container.isShared('Instance3')).toBeFalsy();
    });

    it('Flush Flushes All Bindings Aliases And Resolved Instances', () => {
        const container = new Container();
        container.bind(
            'ConcreteStub',
            () => {
                return new ContainerConcreteStub();
            },
            true
        );
        container.alias('ConcreteStub', 'ContainerConcreteStub');
        container.make('ConcreteStub');
        expect(container.resolved('ConcreteStub')).toBeTruthy();
        expect(container.isAlias('ContainerConcreteStub')).toBeTruthy();
        expect(container.getBindings().has('ConcreteStub')).toBeTruthy();
        expect(container.isShared('ConcreteStub')).toBeTruthy();
        container.flush();
        expect(container.resolved('ConcreteStub')).toBeFalsy();
        expect(container.isAlias('ContainerConcreteStub')).toBeFalsy();
        expect(container.getBindings().has('ConcreteStub')).toBeFalsy();
        expect(container.isShared('ConcreteStub')).toBeFalsy();
    });

    it('Works Resolved Resolves Alias To Binding Name Before Checking', () => {
        const container = new Container();
        container.bind(
            'ConcreteStub',
            () => {
                return new ContainerConcreteStub();
            },
            true
        );
        container.alias('ConcreteStub', 'foo');
        expect(container.resolved('ConcreteStub')).toBeFalsy();
        expect(container.resolved('foo')).toBeFalsy();

        container.make('ConcreteStub');
        expect(container.resolved('ConcreteStub')).toBeTruthy();
        expect(container.resolved('foo')).toBeTruthy();
    });

    it('Works GetAlias', () => {
        const container = new Container();
        container.alias('ConcreteStub', 'foo');
        expect(container.getAlias('foo')).toBe('ConcreteStub');
    });

    it('Works GetAlias Recursive', () => {
        const container = new Container();
        container.alias('ConcreteStub', 'foo');
        container.alias('foo', 'bar');
        container.alias('bar', 'baz');
        expect(container.getAlias('baz')).toBe('ConcreteStub');
        expect(container.isAlias('baz')).toBeTruthy();
        expect(container.isAlias('bar')).toBeTruthy();
        expect(container.isAlias('foo')).toBeTruthy();
    });

    it('Throws Error When Abstract is Same As Alias', () => {
        const container = new Container();
        expect(() => {
            container.alias('name', 'name');
        }).toThrowError('[name] is aliased to itself.');
    });

    it('Works Container Get Factory', () => {
        const container = new Container();
        container.bind('name', () => {
            return 'claudio';
        });
        const factory = container.factory('name');
        expect(container.make('name')).toBe(factory());
    });

    it('Works Container Get Factory', () => {
        const container = new Container();
        container.bind('name', () => {
            return 'claudio';
        });
        const factory = container.factory('name');
        expect(container.make('name')).toBe(factory());
    });

    it('Works Make With Method Is An Alias For Make Method', () => {
        const container = new Container();
        container.bind('name', () => {
            return 'claudio';
        });
        const factory = container.factory('name');
        expect(container.make('name')).toBe(factory());
    });

    it('Works Resolving With Array Of Parameters', () => {
        const container = new Container();
        container.bind('foo', ({ parameters }) => {
            return parameters;
        });

        expect(container.makeWith('foo', [1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('Works Resolving With Parameters Object', () => {
        const container = new Container();
        const instance = container.makeWith(ContainerDefaultValueStub, { defaultValue: 'alberto' });
        expect(instance.defaultValue).toBe('alberto');
    });

    it('Works Resolving With Mixed Parameters Object', () => {
        const container = new Container();
        const instance = container.makeWith(ContainerMixedPrimitiveStub, { first: 1, last: 2, third: 3 });
        expect(instance.first).toBe(1);
        expect(instance.stub).toBeInstanceOf(ContainerConcreteStub);
        expect(instance.last).toBe(2);
        expect('third' in instance).toBeFalsy();
    });

    it('Works Resolving With Using An Interface', () => {
        const container = new Container();
        container.bind(Symbol.for('IContainerContractStub'), ContainerInjectVariableStubWithInterfaceImplementation);
        const instance = container.make<ContainerInjectVariableStubWithInterfaceImplementation>(
            Symbol.for('IContainerContractStub'),
            { something: 'tada' }
        );
        expect(instance.something).toBe('tada');
    });

    it('Works Nested Parameter Override', () => {
        const container = new Container();
        container.bind('foo', ({ container }) => {
            return container.make('bar', { name: 'claudio' });
        });
        container.bind('bar', ({ parameters }) => {
            return parameters;
        });
        expect(container.make('foo', ['something'])).toEqual({ name: 'claudio' });
    });

    it('Works Nested Parameters Are Rest For Fresh Make', () => {
        const container = new Container();
        container.bind('foo', ({ container }) => {
            return container.make('bar');
        });
        container.bind('bar', ({ parameters }) => {
            return parameters;
        });
        expect(container.make('foo', ['something'])).toEqual({});
    });

    it('Singleton Bindings Not Respected With Make Parameters', () => {
        const container = new Container();
        container.singleton('foo', ({ parameters }) => {
            return parameters;
        });
        expect(container.make('foo', { name: 'claudio' })).toEqual({ name: 'claudio' });
        expect(container.make('foo', { name: 'alberto' })).toEqual({ name: 'alberto' });
    });

    it('Can Build Without Parameter Stack With No Constructors', () => {
        const container = new Container();
        expect(container.build(ContainerConcreteStub)).toBeInstanceOf(ContainerConcreteStub);
    });

    it('Can Build Without Parameter Stack With Constructors', () => {
        const container = new Container();
        container.bind(Symbol.for('IContainerContractStub'), ContainerImplementationStub);
        expect(container.build(ContainerDependentStub)).toBeInstanceOf(ContainerDependentStub);
    });

    it('Knows Entry', () => {
        const container = new Container();
        container.bind(Symbol.for('IContainerContractStub'), ContainerImplementationStub);
        expect(container.has(Symbol.for('IContainerContractStub'))).toBeTruthy();
    });

    it('Can Bind Any Word', () => {
        const container = new Container();
        @constructable()
        class Test {}

        container.bind('Claudio', Test);
        expect(container.get('Claudio')).toBeInstanceOf(Test);
    });

    it('Can Resolve Classes', () => {
        const container = new Container();
        const obj = container.get(ContainerConcreteStub);
        expect(obj).toBeInstanceOf(ContainerConcreteStub);
    });

    it('Not Constructable Classes Throw Errors', () => {
        const container = new Container();

        class Test {}

        container.bind('Claudio', Test);
        expect(() => {
            container.get('Claudio');
        }).toThrowError('Target class [Test] must be decorate with constructable!');
    });

    it('Can Dynamically Set Service', () => {
        const container = new Container() as Container & { [key: string]: any };
        expect('name' in container).toBeFalsy();
        container.name = 'Claudio';
        expect('name' in container).toBeTruthy();
        expect(container.name).toBe('Claudio');
    });

    it('Unknown Entry Throws Error', () => {
        const container = new Container();
        expect(() => {
            container.get('Claudio');
        }).toThrowError('Target [Claudio] is not instantiable.');
    });

    it('Can Catch Circular Dependency', () => {
        const container = new Container();
        expect(() => {
            container.get(CircularAStub);
        }).toThrowError('Unresolvable dependency resolving [[Parameter #0 [ <required> a ]] in class CircularCStub.');
    });

    it('Works Refresh', () => {
        const container = new Container();
        container.bind(Symbol.for('IContainerContractStub'), ContainerImplementationStubTwo);
        const instance = container.make(Refreshable);
        container.refresh(Symbol.for('IContainerContractStub'), instance, 'setConcrete');
        expect(instance.concrete).toBeInstanceOf(ContainerImplementationStubTwo);

        container.bind(Symbol.for('IContainerContractStub'), ContainerImplementationStub);
        expect(instance.concrete).toBeInstanceOf(ContainerImplementationStub);
    });
});
