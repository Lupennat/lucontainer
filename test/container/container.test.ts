import { expect } from 'chai';
import { constructable, Container, inject } from '../../src/index';
import CircularAStub from '../stubs/circular-a-stub';
after(async () => {
    Container.setInstance(null);
});

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
    public constructor(concrete: ContainerConcreteStub, public something: any) {}
}

@constructable()
class Refreshable {
    constructor(@inject(Symbol.for('IContainerContractStub')) public concrete: IContainerContractStub) {}
    public setConcrete(concrete: IContainerContractStub) {
        this.concrete = concrete;
        return this;
    }
}

@constructable()
class ContainerImplementationStubTwo implements IContainerContractStub {
    //
}

describe('Container', () => {
    it('Works Singleton', () => {
        const container = Container.setInstance(new Container());
        Container.setInstance();
        const container2 = Container.getInstance();
        expect(container2).to.be.instanceOf(Container);
        expect(container === container2).to.be.false;
        const container3 = Container.getInstance();
        expect(container3 === container2).to.be.true;
    });

    it('Works Closure Resolution', () => {
        const container = new Container();
        container.bind('name', () => {
            return 'Claudio';
        });
        expect(container.make('name')).to.eq('Claudio');
    });

    it('Works BindIf Doesnt Register If Service Already Registered', () => {
        const container = new Container();

        container.bind('name', () => {
            return 'Claudio';
        });

        container.bindIf('name', () => {
            return 'Alberto';
        });

        expect(container.make('name')).to.eq('Claudio');

        container.bind(ContainerConcreteStub, ContainerImplementationStub);
        container.bindIf(ContainerConcreteStub);

        expect(container.make(ContainerConcreteStub)).to.be.instanceOf(ContainerImplementationStub);
    });

    it('Works BindIf Does Register If Service Not Registered Yet', () => {
        const container = new Container();

        container.bind('surname', () => {
            return 'Claudio';
        });

        container.bindIf('name', () => {
            return 'Alberto';
        });

        expect(container.make('name')).to.eq('Alberto');

        container.bindIf(ContainerConcreteStub);
        expect(container.make(ContainerConcreteStub)).to.be.instanceOf(ContainerConcreteStub);
    });

    it('Works SingletonIf Doesnt Register If Binding Already Registered', () => {
        const container = new Container();

        container.singleton('name', () => {
            return 'Claudio';
        });

        container.singletonIf('name', () => {
            return 'Alberto';
        });

        expect(container.make('name')).to.eq('Claudio');

        container.singleton(ContainerConcreteStub, ContainerImplementationStub);
        container.singletonIf(ContainerConcreteStub);

        expect(container.make(ContainerConcreteStub)).to.be.instanceOf(ContainerImplementationStub);
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
        expect(firstInstantiation === secondInstantiation).to.true;

        container.singletonIf(ContainerConcreteStub);
        expect(container.make(ContainerConcreteStub)).to.be.instanceOf(ContainerConcreteStub);
    });

    it('Works Shared Closure Resolution', () => {
        const container = new Container();

        container.singleton('class', () => {
            return new (class {})();
        });
        const firstInstantiation = container.make('class');
        const secondInstantiation = container.make('class');
        expect(firstInstantiation === secondInstantiation).to.true;
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
        expect(firstInstantiation === secondInstantiation).to.true;
    });

    it('Works ScopedIf', () => {
        const container = new Container();

        container.scopedIf('class', () => {
            return 'foo';
        });
        expect(container.make('class')).to.eq('foo');

        container.scopedIf('class', () => {
            return 'bar';
        });

        expect(container.make('class') === container.make('class')).to.true;
        expect(container.make('class')).to.not.eq('bar');

        container.scopedIf(ContainerConcreteStub, ContainerImplementationStub);
        container.scopedIf(ContainerConcreteStub);

        expect(container.make(ContainerConcreteStub) === container.make(ContainerConcreteStub)).to.be.true;
        expect(container.make(ContainerConcreteStub)).to.be.instanceOf(ContainerImplementationStub);
    });

    it('Works Scoped Closure Resets', () => {
        const container = new Container();

        container.scoped('class', () => {
            return new (class {})();
        });

        const firstInstantiation = container.make('class');

        container.forgetScopedInstances();

        const secondInstantiation = container.make('class');

        expect(firstInstantiation === secondInstantiation).to.false;
    });

    it('Works Auto Concrete Resolution', () => {
        const container = new Container();

        expect(container.make(ContainerConcreteStub)).to.be.instanceOf(ContainerConcreteStub);
    });

    it('Works Shared Concrete Resolution', () => {
        const container = new Container();
        container.singleton(ContainerConcreteStub);
        const first = container.make(ContainerConcreteStub);
        const second = container.make(ContainerConcreteStub);
        expect(first === second).to.true;
    });

    it('Works Scoped Concrete Resolution Reset', () => {
        const container = new Container();
        container.scoped(ContainerConcreteStub);
        const first = container.make(ContainerConcreteStub);
        container.forgetScopedInstances();
        const second = container.make(ContainerConcreteStub);
        expect(first === second).to.false;
    });

    it('Bind Fails Loudly With Invalid Argument', () => {
        const container = new Container();
        const concrete = new ContainerConcreteStub();
        expect(() => {
            // @ts-expect-error
            container.bind(ContainerConcreteStub, concrete);
        }).throw('concrete should be a closure or a class, "object" given');

        expect(() => {
            container.bind(Symbol.for('IContainerContractStub'));
        }).throw('please provide a concrete for abstract Symbol(IContainerContractStub)');
    });

    it('Works Abstract To Concrete Resolution', () => {
        const container = new Container();
        container.bind(Symbol.for('IContainerContractStub'), ContainerImplementationStub);
        const obj = container.make(ContainerDependentStub);
        expect(obj.impl).to.be.instanceOf(ContainerImplementationStub);
    });

    it('Works Nested Dependency Resolution', () => {
        const container = new Container();
        container.bind(Symbol.for('IContainerContractStub'), ContainerImplementationStub);
        const obj = container.make(ContainerNestedDependentStub);
        expect(obj.inner).to.be.instanceOf(ContainerDependentStub);
        expect(obj.inner.impl).to.be.instanceOf(ContainerImplementationStub);
    });

    it('Works Container Is Passed To Resolvers', () => {
        const container = new Container();
        container.bind('something', container => {
            return container;
        });
        const c = container.make<Container>('something');

        expect(c === container).to.be.true;
    });

    it('Works Proxy Handlers', () => {
        let container = new Container() as Container & { [key: string | symbol]: any };
        expect(Symbol.for('something') in container).to.be.false;
        container[Symbol.for('something')] = () => {
            return 'foo';
        };
        expect(Symbol.for('something') in container).to.be.true;
        expect(container.get(Symbol.for('something'))).to.eq('foo');
        expect(container[Symbol.for('something')]).to.not.undefined;
        delete container[Symbol.for('something')];
        expect(Symbol.for('something') in container).to.be.false;

        //test proxy set when it's not a closure
        container = new Container() as Container & { [key: string]: any };
        container.something = 'text';
        expect('something' in container).to.be.true;
        expect(container.something).to.not.undefined;
        expect(container.something).to.eq('text');
        delete container.something;
        expect('something' in container).to.be.false;

        container.toJSON = () => {
            return 'toJSON isReserved it does not register a binding';
        };
        expect('toJSON' in container).to.be.true;
        expect(container.toJSON).to.not.eq('toJSON isReserved it does not register a binding');
        expect(JSON.stringify(container)).to.eq('"toJSON isReserved it does not register a binding"');
    });

    it('Works Aliases', () => {
        const container = new Container() as Container & { [key: string]: any };
        container.foo = 'bar';
        container.alias('foo', 'baz');
        container.alias('baz', 'bat');
        expect(container.make('foo') === 'bar').to.be.true;
        expect(container.make('baz') === 'bar').to.be.true;
        expect(container.make('bat') === 'bar').to.be.true;
    });

    it('Aliases Fails Loudly With Invalid Arguments', () => {
        const container = new Container() as Container & { [key: string]: any };
        container.foo = 'bar';
        expect(() => {
            container.alias('foo', 'foo');
        }).throw('[foo] is aliased to itself');

        container.bind(ContainerConcreteStub);

        expect(() => {
            container.alias(ContainerConcreteStub, ContainerConcreteStub);
        }).throw('[ContainerConcreteStub] is aliased to itself');
    });

    it('Works Aliases With Array Of Parameters', () => {
        const container = new Container();

        container.bind('foo', (container, parameters) => {
            return parameters;
        });
        container.alias('foo', 'baz');

        expect(container.make<number[]>('baz', [1, 2, 3])).to.eql([1, 2, 3]);

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
        expect(resolved.a).to.eq(1);
        expect(resolved.b).to.eq(2);
        expect(resolved.c).to.eq(3);
        // because has default it doesn't throw an error even if 'NotValidBinding' doesn't exists
        expect(resolved.d).to.eq(4);
    });

    it('Works Bindings Can Be Overriden', () => {
        const container = new Container() as Container & { [key: string]: any };

        container.foo = 'bar';
        container.foo = 'baz';

        expect(container.foo).to.eq('baz');
    });

    it('Works Binding An Instance Returns The Instance', () => {
        const container = new Container();

        const bound = new (class {})();
        const resolved = container.instance('foo', bound);

        expect(resolved === bound).to.be.true;
    });

    it('Works Binding An Instance As Shared', () => {
        const container = new Container();

        const bound = new (class {})();
        container.instance('foo', bound);
        const obj = container.make('foo');

        expect(obj === bound).to.be.true;
    });

    it('Works Binding An Existing Instance Remove Aliases', () => {
        const container = new Container();

        const bound = new (class {})();
        container.instance('test', bound);
        container.alias('test', 'foo');
        container.alias('foo', 'bar');

        let obj = container.make('test');
        expect(obj === bound).to.be.true;
        obj = container.make('foo');
        expect(obj === bound).to.be.true;
        obj = container.make('bar');
        expect(obj === bound).to.be.true;

        const rebound = new (class {})();
        container.instance('foo', rebound);

        obj = container.make('test');
        expect(bound === obj).to.be.true;
        obj = container.make('foo');
        expect(bound === obj).to.be.false;
        expect(rebound === obj).to.be.true;
        obj = container.make('bar');
        expect(obj === rebound).to.be.true;
    });

    it('Works Resolution Of Default Parameters', () => {
        const container = new Container();
        const instance = container.make(ContainerDefaultValueStub);
        expect(instance.stub).to.be.instanceOf(ContainerConcreteStub);
        expect(instance.defaultValue).to.eq('claudio');
    });

    it('Works Bound', () => {
        let container = new Container();
        container.bind(ContainerConcreteStub, () => {
            return undefined;
        });
        expect(container.bound(ContainerConcreteStub)).to.be.true;
        expect(container.bound(Symbol.for('IContainerContractStub'))).to.be.false;

        container = new Container();
        container.bind(Symbol.for('IContainerContractStub'), ContainerConcreteStub);
        expect(container.bound(Symbol.for('IContainerContractStub'))).to.be.true;
        expect(container.bound(ContainerConcreteStub)).to.be.false;
    });

    it('Works Proxy Delete Remove Bound Instances', () => {
        const container = new Container() as Container & { [key: string]: any };
        container.instance('object', new (class {})());
        delete container.object;

        expect(container.bound('object')).to.be.false;
    });

    it('Works Bound Instance And Alias Check Via Proxy', () => {
        const container = new Container() as Container & { [key: string]: any };
        container.instance('object', new (class {})());
        container.alias('object', 'alias');
        expect('object' in container).to.be.true;
        expect('alias' in container).to.be.true;
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
        expect(rebind).to.be.true;
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
        expect(rebind).to.be.true;
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
        expect(rebind).to.be.false;
    });

    it('Works Internal Class With Default Parameters', () => {
        const container = new Container();
        expect(() => {
            container.make(ContainerMixedPrimitiveStub);
        }).to.throw(
            'Unresolvable dependency resolving [[Parameter #0 [ <required> first ]] in class ContainerMixedPrimitiveStub'
        );
    });

    it('Throw Binding Resolution Error Message', () => {
        const container = new Container();
        expect(() => {
            container.make(Symbol.for('IContainerContractStub'));
        }).to.throw('Target [Symbol(IContainerContractStub)] is not instantiable.');
    });

    it('Throw Binding Resolution Error Message Includes Build Stack', () => {
        const container = new Container();
        expect(() => {
            container.make(ContainerDependentStub);
        }).to.throw(
            'Target [Symbol(IContainerContractStub)] is not instantiable while building [ContainerDependentStub].'
        );
    });

    it('ForgetInstance Forgets Instance', () => {
        const container = new Container();
        const containerConcreteStub = new ContainerConcreteStub();
        container.instance(ContainerConcreteStub, containerConcreteStub);
        expect(container.isShared(ContainerConcreteStub)).to.be.true;
        container.forgetInstance(ContainerConcreteStub);
        expect(container.isShared(ContainerConcreteStub)).to.be.false;
    });

    it('ForgetInstances Forgets All Instances', () => {
        const container = new Container();
        const containerConcreteStub1 = new ContainerConcreteStub();
        const containerConcreteStub2 = new ContainerConcreteStub();
        const containerConcreteStub3 = new ContainerConcreteStub();
        container.instance('Instance1', containerConcreteStub1);
        container.instance('Instance2', containerConcreteStub2);
        container.instance('Instance3', containerConcreteStub3);
        expect(container.isShared('Instance1')).to.be.true;
        expect(container.isShared('Instance2')).to.be.true;
        expect(container.isShared('Instance3')).to.be.true;
        container.forgetInstances();
        expect(container.isShared('Instance1')).to.be.false;
        expect(container.isShared('Instance2')).to.be.false;
        expect(container.isShared('Instance3')).to.be.false;
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
        expect(container.resolved('ConcreteStub')).to.be.true;
        expect(container.isAlias('ContainerConcreteStub')).to.be.true;
        expect(container.getBindings().has('ConcreteStub')).to.be.true;
        expect(container.isShared('ConcreteStub')).to.be.true;
        container.flush();
        expect(container.resolved('ConcreteStub')).to.be.false;
        expect(container.isAlias('ContainerConcreteStub')).to.be.false;
        expect(container.getBindings().has('ConcreteStub')).to.be.false;
        expect(container.isShared('ConcreteStub')).to.be.false;
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
        expect(container.resolved('ConcreteStub')).to.be.false;
        expect(container.resolved('foo')).to.be.false;

        container.make('ConcreteStub');
        expect(container.resolved('ConcreteStub')).to.be.true;
        expect(container.resolved('foo')).to.be.true;
    });

    it('Works GetAlias', () => {
        const container = new Container();
        container.alias('ConcreteStub', 'foo');
        expect(container.getAlias('foo')).to.eq('ConcreteStub');
    });

    it('Works GetAlias Recursive', () => {
        const container = new Container();
        container.alias('ConcreteStub', 'foo');
        container.alias('foo', 'bar');
        container.alias('bar', 'baz');
        expect(container.getAlias('baz')).to.eq('ConcreteStub');
        expect(container.isAlias('baz')).to.be.true;
        expect(container.isAlias('bar')).to.be.true;
        expect(container.isAlias('foo')).to.be.true;
    });

    it('Throws Error When Abstract is Same As Alias', () => {
        const container = new Container();
        expect(() => {
            container.alias('name', 'name');
        }).to.throw('[name] is aliased to itself.');
    });

    it('Works Container Get Factory', () => {
        const container = new Container();
        container.bind('name', () => {
            return 'claudio';
        });
        const factory = container.factory('name');
        expect(container.make('name')).to.eq(factory());
    });

    it('Works Container Get Factory', () => {
        const container = new Container();
        container.bind('name', () => {
            return 'claudio';
        });
        const factory = container.factory('name');
        expect(container.make('name')).to.eq(factory());
    });

    it('Works Make With Method Is An Alias For Make Method', () => {
        const container = new Container();
        container.bind('name', () => {
            return 'claudio';
        });
        const factory = container.factory('name');
        expect(container.make('name')).to.eq(factory());
    });

    it('Works Resolving With Array Of Parameters', () => {
        const container = new Container();
        container.bind('foo', (container, parameters) => {
            return parameters;
        });

        expect(container.makeWith('foo', [1, 2, 3])).to.eql([1, 2, 3]);
    });

    it('Works Resolving With Parameters Object', () => {
        const container = new Container();
        const instance = container.makeWith(ContainerDefaultValueStub, { defaultValue: 'alberto' });
        expect(instance.defaultValue).to.eq('alberto');
    });

    it('Works Resolving With Mixed Parameters Object', () => {
        const container = new Container();
        const instance = container.makeWith(ContainerMixedPrimitiveStub, { first: 1, last: 2, third: 3 });
        expect(instance.first).to.eq(1);
        expect(instance.stub).to.be.instanceOf(ContainerConcreteStub);
        expect(instance.last).to.eq(2);
        expect('third' in instance).to.be.false;
    });

    it('Works Resolving With Using An Interface', () => {
        const container = new Container();
        container.bind(Symbol.for('IContainerContractStub'), ContainerInjectVariableStubWithInterfaceImplementation);
        const instance = container.make<ContainerInjectVariableStubWithInterfaceImplementation>(
            Symbol.for('IContainerContractStub'),
            { something: 'tada' }
        );
        expect(instance.something).to.eq('tada');
    });

    it('Works Nested Parameter Override', () => {
        const container = new Container();
        container.bind('foo', container => {
            return container.make('bar', { name: 'claudio' });
        });
        container.bind('bar', (container, parameters) => {
            return parameters;
        });
        expect(container.make('foo', ['something'])).to.eql({ name: 'claudio' });
    });

    it('Works Nested Parameters Are Rest For Fresh Make', () => {
        const container = new Container();
        container.bind('foo', container => {
            return container.make('bar');
        });
        container.bind('bar', (container, parameters) => {
            return parameters;
        });
        expect(container.make('foo', ['something'])).to.eql({});
    });

    it('Singleton Bindings Not Respected With Make Parameters', () => {
        const container = new Container();
        container.singleton('foo', (container, parameters) => {
            return parameters;
        });
        expect(container.make('foo', { name: 'claudio' })).to.eql({ name: 'claudio' });
        expect(container.make('foo', { name: 'alberto' })).to.eql({ name: 'alberto' });
    });

    it('Can Build Without Parameter Stack With No Constructors', () => {
        const container = new Container();
        expect(container.build(ContainerConcreteStub)).to.be.instanceOf(ContainerConcreteStub);
    });

    it('Can Build Without Parameter Stack With Constructors', () => {
        const container = new Container();
        container.bind(Symbol.for('IContainerContractStub'), ContainerImplementationStub);
        expect(container.build(ContainerDependentStub)).to.be.instanceOf(ContainerDependentStub);
    });

    it('Knows Entry', () => {
        const container = new Container();
        container.bind(Symbol.for('IContainerContractStub'), ContainerImplementationStub);
        expect(container.has(Symbol.for('IContainerContractStub'))).to.be.true;
    });

    it('Can Bind Any Word', () => {
        const container = new Container();
        @constructable()
        class Test {}

        container.bind('Claudio', Test);
        expect(container.get('Claudio')).to.be.instanceOf(Test);
    });

    it('Can Resolve Classes', () => {
        const container = new Container();
        const obj = container.get(ContainerConcreteStub);
        expect(obj).to.be.instanceOf(ContainerConcreteStub);
    });

    it('Not Constructable Classes Throw Errors', () => {
        const container = new Container();

        class Test {}

        container.bind('Claudio', Test);
        expect(() => {
            container.get('Claudio');
        }).throw('Target class [Test] must be decorate with constructable!');
    });

    it('Can Dynamically Set Service', () => {
        const container = new Container() as Container & { [key: string]: any };
        expect('name' in container).to.be.false;
        container.name = 'Claudio';
        expect('name' in container).to.be.true;
        expect(container.name).to.eq('Claudio');
    });

    it('Unknown Entry Throws Error', () => {
        const container = new Container();
        expect(() => {
            container.get('Claudio');
        }).throw('Target [Claudio] is not instantiable.');
    });

    it('Can Catch Circular Dependency', () => {
        const container = new Container();
        expect(() => {
            container.get(CircularAStub);
        }).throw(
            'Unresolvable dependency resolving [[Parameter #0 [ <required> a ]] in class CircularCStub inside circular dependency.'
        );
    });

    it('Works Refresh', () => {
        const container = new Container();
        container.bind(Symbol.for('IContainerContractStub'), ContainerImplementationStubTwo);
        const instance = container.make(Refreshable);
        container.refresh(Symbol.for('IContainerContractStub'), instance, 'setConcrete');
        expect(instance.concrete).to.be.instanceOf(ContainerImplementationStubTwo);

        container.bind(Symbol.for('IContainerContractStub'), ContainerImplementationStub);
        expect(instance.concrete).to.be.instanceOf(ContainerImplementationStub);
    });

    it('Works Set', () => {
        const container = new Container();
        container.set('foo', [1, 2, 3]);
        expect(container.make('foo')).to.eql([1, 2, 3]);
        container.set('foo', ContainerImplementationStub);
        expect(container.make('foo')).to.be.instanceOf(ContainerImplementationStub);
        container.set('foo', () => {
            return 'foo';
        });
        expect(container.make('foo')).to.eq('foo');
    });
});
