import { expect } from 'chai';
import { annotate, constructable, Container, methodable } from '../../src';

function printAllArguments(args: IArguments, params: any[] = []) {
    for (let x = 0; x < params.length; x++) {
        args[x] = params[x];
    }
    return Array.from(args);
}

@constructable()
class ContainerCallConcreteStub {
    //
}

@constructable()
class ContainerTestCallStub {
    @methodable()
    public work() {
        return printAllArguments(arguments);
    }

    @methodable()
    public inject(stub: ContainerCallConcreteStub, defaultValue = 'claudio') {
        return printAllArguments(arguments, [stub, defaultValue]);
    }

    @methodable()
    public unresolvable(foo: any, bar: any) {
        return printAllArguments(arguments, [foo, bar]);
    }
}

function containerTestInject(stub: ContainerCallConcreteStub, defaultValue = 'claudio') {
    return printAllArguments(arguments, [stub, defaultValue]);
}

annotate(containerTestInject, [], [ContainerCallConcreteStub]);

@constructable()
class ContainerStaticMethodStub {
    @methodable()
    public static inject(stub: ContainerCallConcreteStub, defaultValue = 'claudio') {
        return printAllArguments(arguments, [stub, defaultValue]);
    }
}

@constructable()
class ContainerCallCallableClassStringStub {
    constructor(public stub: ContainerCallConcreteStub, public defaultValue = 'claudio') {}

    @methodable()
    public invoke(dependency: ContainerTestCallStub) {
        return [this.stub, this.defaultValue, dependency];
    }
}

@constructable()
class StdClass {}

describe('Container Call', () => {
    it('Call Class Method Without Method Throws Error', () => {
        const container = new Container();
        expect(() => {
            container.call([ContainerTestCallStub, 'notexist']);
        }).throw('Target method [ContainerTestCallStub.prototype.notexist] is not a function.');

        expect(() => {
            container.call([ContainerTestCallStub, 'notexist', true]);
        }).throw('Target method [ContainerTestCallStub.notexist] is not a function.');
    });

    it('Call Class Method Without Methodable Throws Error', () => {
        const container = new Container();

        @constructable()
        class Test {
            notvalid() {}
            static notvalid() {}
        }
        expect(() => {
            container.call([Test, 'notvalid']);
        }).throw('Target method [Test.prototype.notvalid] must be decorate with methodable!');

        expect(() => {
            container.call([Test, 'notvalid', true]);
        }).throw('Target method [Test.notvalid] must be decorate with methodable!');
    });

    it('Call Class Method', () => {
        let container = new Container();
        let result = container.call([ContainerTestCallStub, 'work'], ['foo', 'bar']);
        expect(result).to.eql(['foo', 'bar']);

        container = new Container();
        result = container.call([ContainerTestCallStub, 'inject']);
        expect(result[0]).to.be.instanceOf(ContainerCallConcreteStub);
        expect(result[1]).to.eq('claudio');

        container = new Container();
        result = container.call([ContainerTestCallStub, 'inject'], { defaultValue: 'foo' });
        expect(result[0]).to.be.instanceOf(ContainerCallConcreteStub);
        expect(result[1]).to.eq('foo');
    });

    it('Call Instance Method With Callable Array', () => {
        const container = new Container();
        const stub = new ContainerTestCallStub();
        const result = container.call([stub, 'work'], ['foo', 'bar']);
        expect(result).to.eql(['foo', 'bar']);
    });

    it('Call Class Static Method', () => {
        const container = new Container();
        const result = container.call([ContainerStaticMethodStub, 'inject', true]);
        expect(result[0]).to.be.instanceOf(ContainerCallConcreteStub);
        expect(result[1]).to.eq('claudio');
    });

    it('Call Function', () => {
        const container = new Container();
        const result = container.call(containerTestInject);
        expect(result[0]).to.be.instanceOf(ContainerCallConcreteStub);
        expect(result[1]).to.eq('claudio');
    });

    it('Call Function Without Annotate Throws Error', () => {
        const container = new Container();
        const fnToCall = function () {};
        expect(() => {
            container.call(fnToCall);
        }).throw('Target function [fnToCall] must be annotate!');
    });

    it('Call With Bound Method', () => {
        let container = new Container();
        container.bindMethod([ContainerTestCallStub, 'unresolvable'], (stub: ContainerTestCallStub) => {
            return stub.unresolvable('foo', 'bar');
        });
        let result = container.call([ContainerTestCallStub, 'unresolvable']);
        expect(result).to.eql(['foo', 'bar']);

        container = new Container();
        container.bindMethod([ContainerStaticMethodStub, 'inject', true], (stub: typeof ContainerStaticMethodStub) => {
            return stub.inject('foo', 'bar');
        });

        result = container.call([ContainerStaticMethodStub, 'inject', true]);
        expect(result).to.eql(['foo', 'bar']);

        container = new Container();
        container.bindMethod([ContainerTestCallStub, 'unresolvable'], (stub: ContainerTestCallStub) => {
            return stub.unresolvable('foo', 'bar');
        });
        result = container.call([new ContainerTestCallStub(), 'unresolvable']);
        expect(result).to.eql(['foo', 'bar']);

        container = new Container();
        result = container.call([new ContainerTestCallStub(), 'inject'], {
            _stub: 'foo',
            defaultValue: 'bar'
        });

        expect(result[0]).to.be.instanceOf(ContainerCallConcreteStub);
        expect(result[1]).to.eq('bar');

        container = new Container();
        result = container.call([new ContainerTestCallStub(), 'inject'], {
            _stub: 'foo'
        });

        expect(result[0]).to.be.instanceOf(ContainerCallConcreteStub);
        expect(result[1]).to.eq('claudio');
    });

    it('Bind Method Accepts An Array', () => {
        let container = new Container();
        container.bindMethod([ContainerTestCallStub, 'unresolvable'], (stub: ContainerTestCallStub) => {
            return stub.unresolvable('foo', 'bar');
        });
        let result = container.call([ContainerTestCallStub, 'unresolvable']);
        expect(result).to.eql(['foo', 'bar']);

        container = new Container();
        container.bindMethod([ContainerTestCallStub, 'unresolvable'], (stub: ContainerTestCallStub) => {
            return stub.unresolvable('foo', 'bar');
        });
        result = container.call([new ContainerTestCallStub(), 'unresolvable']);
        expect(result).to.eql(['foo', 'bar']);
    });

    it('Works Closure Call With Injected Dependency', () => {
        const container = new Container();

        function test(stub: ContainerCallConcreteStub) {
            return printAllArguments(arguments, [stub]);
        }

        annotate(test, [], [ContainerCallConcreteStub]);

        let result = container.call(test, { foo: 'bar' });

        expect(result[0]).to.be.instanceOf(ContainerCallConcreteStub);

        result = container.call(test, { foo: 'bar', stub: new ContainerCallConcreteStub() });

        expect(result[0]).to.be.instanceOf(ContainerCallConcreteStub);
    });

    it('Works Closure Call With Dependency', () => {
        const container = new Container();
        let fnToCall = function (foo: StdClass, bar: any[] = []) {
            return printAllArguments(arguments, [foo, bar]);
        };
        annotate(fnToCall, [], [StdClass]);

        let result = container.call(fnToCall);
        expect(result[0]).to.be.instanceOf(StdClass);
        expect(result[1]).to.eql([]);

        result = container.call(fnToCall, { bar: 'claudio' });
        expect(result[0]).to.be.instanceOf(StdClass);
        expect(result[1]).to.eq('claudio');

        result = container.call(fnToCall, [new StdClass()]);
        expect(result[0]).to.be.instanceOf(StdClass);
        expect(result[1]).to.eql([]);

        /**
         * Wrap a Function
         */
        result = container.wrap(fnToCall, { bar: 'claudio' });

        expect(typeof result).to.eq('function');
        expect(result === fnToCall).to.be.false;
        result = result();

        expect(result[0]).to.be.instanceOf(StdClass);
        expect(result[1]).to.eq('claudio');

        result = container.wrap(fnToCall);

        expect(typeof result).to.eq('function');
        expect(result === fnToCall).to.be.false;
        result = result();

        expect(result[0]).to.be.instanceOf(StdClass);
        expect(result[1]).to.eql([]);
    });

    it('Works Call With Variadic Dependency', () => {
        const stub1 = new ContainerCallConcreteStub();
        const stub2 = new ContainerCallConcreteStub();
        const container = new Container();

        const fnToCall = function (foo: StdClass, ...bar: ContainerCallConcreteStub[]) {
            return printAllArguments(arguments, [foo, ...bar]);
        };

        annotate(fnToCall, [], [StdClass, ContainerCallConcreteStub]);

        let result = container.call(fnToCall);
        expect(result[0]).to.be.instanceOf(StdClass);
        expect(result[1]).to.be.instanceOf(ContainerCallConcreteStub);

        result = container.call(fnToCall, []);
        expect(result[0]).to.be.instanceOf(StdClass);
        expect(result[1]).to.be.instanceOf(ContainerCallConcreteStub);

        container.bind(ContainerCallConcreteStub, () => {
            return [stub1, stub2];
        });

        result = container.call(fnToCall, []);
        expect(result[0]).to.be.instanceOf(StdClass);
        expect(result[1]).to.be.instanceOf(ContainerCallConcreteStub);
        expect(result[1]).to.eq(stub1);
        expect(result[2]).to.eq(stub2);

        result = container.call(fnToCall);
        expect(result[0]).to.be.instanceOf(StdClass);
        expect(result[1]).to.be.instanceOf(ContainerCallConcreteStub);
        expect(result[1]).to.eq(stub1);
        expect(result[2]).to.eq(stub2);
    });

    it('Works Call With Callable Class', () => {
        const container = new Container();
        const result = container.call([ContainerCallCallableClassStringStub, 'invoke']);
        expect(result[0]).to.be.instanceOf(ContainerCallConcreteStub);
        expect(result[1]).to.eq('claudio');
        expect(result[2]).to.be.instanceOf(ContainerTestCallStub);
    });

    it('Works Call Method Bindings', () => {
        const container = new Container();
        container.bindMethod([ContainerTestCallStub, 'unresolvable'], (stub: ContainerTestCallStub) => {
            return stub.unresolvable('foo', 'bar');
        });
        const result = container.callMethodBinding(
            [ContainerTestCallStub, 'unresolvable'],
            new ContainerTestCallStub()
        );
        expect(result).to.eql(['foo', 'bar']);
    });

    it('Works Has Method Bindings', () => {
        const container = new Container();
        container.bindMethod([ContainerTestCallStub, 'unresolvable'], (stub: ContainerTestCallStub) => {
            return stub.unresolvable('foo', 'bar');
        });
        let result = container.hasMethodBinding([ContainerTestCallStub, 'unresolvable']);
        expect(result).to.be.true;
        result = container.hasMethodBinding([ContainerTestCallStub, 'notbinded']);
        expect(result).to.be.false;
    });

    it('Throw Error When Call Without Required Parameters', () => {
        const container = new Container();
        expect(() => {
            container.call([ContainerTestCallStub, 'unresolvable']);
        }).throw('Unresolvable dependency resolving [[Parameter #0 [ <required> foo ]] in class ContainerTestCallStub');
    });

    it(' Throw Error When Call With Unnamed Parameters', () => {
        const container = new Container();

        expect(() => {
            container.call([new ContainerTestCallStub(), 'unresolvable'], ['foo', 'bar']);
        }).throw(
            'Unresolvable dependency resolving [[Parameter #0 [ <required> foo ]] in class ContainerTestCallStub.'
        );
    });

    it('Throw Error When Call Without Required Parameters On Closure', () => {
        const container = new Container();
        const fnToCall = function (foo: string, bar: string = 'default') {};

        annotate(fnToCall, [], []);

        expect(() => {
            container.call(fnToCall);
        }).throw('Unresolvable dependency resolving [[Parameter #0 [ <required> foo ]] in class fnToCall');
    });
});
