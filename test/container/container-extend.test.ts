import { expect } from 'chai';
import Container, { constructable } from '../../src';

@constructable()
class ContainerLazyExtendStub {
    public static initialized: boolean = false;

    public init() {
        ContainerLazyExtendStub.initialized = true;
    }
}

describe('Container Extend', () => {
    it('Works Bindings', () => {
        let container = new Container() as Container & { [key: string]: any };
        container.foo = 'foo';
        container.extend('foo', (old: string) => {
            return old + 'bar';
        });

        expect(container.make('foo')).to.eq('foobar');
        container = new Container();
        container.singleton('foo', () => {
            return {
                name: 'claudio'
            };
        });
        container.extend('foo', (old: { [key: string]: any }) => {
            old.age = 38;
            return old;
        });

        const res = container.make<{ [key: string]: any }>('foo');
        expect(res.name).to.eq('claudio');
        expect(res.age).to.eq(38);
        expect(res === container.make('foo')).to.be.true;
    });

    it('Works Extend Instances Are Preserved', () => {
        const container = new Container();
        container.bind('foo', () => {
            const obj: { [key: string]: any } = new (class {})();

            obj.foo = 'bar';
            return obj;
        });

        const obj: { [key: string]: any } = new (class {})();

        obj.foo = 'foo';
        container.instance('foo', obj);
        container.extend('foo', (old: { [key: string]: any }) => {
            old.bar = 'bar';
            return old;
        });

        container.extend('foo', (old: { [key: string]: any }) => {
            old.baz = 'baz';
            return old;
        });

        expect(container.make<{ [key: string]: any }>('foo').foo).to.eq('foo');
        expect(container.make<{ [key: string]: any }>('foo').bar).to.eq('bar');
        expect(container.make<{ [key: string]: any }>('foo').baz).to.eq('baz');
    });

    it('Works Extend Is Lazy Initialized', () => {
        ContainerLazyExtendStub.initialized = false;
        const container = new Container();
        container.bind(ContainerLazyExtendStub);

        container.extend(ContainerLazyExtendStub, (old: ContainerLazyExtendStub) => {
            old.init();
            return old;
        });

        expect(ContainerLazyExtendStub.initialized).to.be.false;
        container.make(ContainerLazyExtendStub);
        expect(ContainerLazyExtendStub.initialized).to.be.true;
    });

    it('Works Extend Can Be Called Before Bind', () => {
        ContainerLazyExtendStub.initialized = false;
        const container = new Container() as Container & { [key: string]: any };
        container.extend('foo', (old: string) => {
            return old + 'bar';
        });
        container.foo = 'foo';
        expect(container.make('foo')).to.eq('foobar');
    });

    it('Works Extend Instance Rebind Callback', () => {
        let rebind: boolean = false;
        const container = new Container();
        container.rebinding('foo', () => {
            rebind = true;
        });
        const obj = new (class {})();
        container.instance('foo', obj);
        container.extend('foo', old => {
            return old;
        });

        expect(rebind).to.be.true;
    });

    it('Works Extend Bind Rebind Callback', () => {
        let rebind: boolean = false;
        const container = new Container();

        container.rebinding('foo', () => {
            rebind = true;
        });

        container.bind('foo', () => {
            return new (class {})();
        });

        expect(rebind).to.be.false;

        container.make('foo');
        container.extend('foo', old => {
            return old;
        });

        expect(rebind).to.be.true;
    });

    it('Extension Works On Aliases Bindings', () => {
        const container = new Container();

        container.singleton('something', () => {
            return 'some value';
        });
        container.alias('something', 'something-alias');

        container.extend('something-alias', (old: string) => {
            return old + ' extended';
        });

        expect(container.make('something')).to.eq('some value extended');
    });

    it('Works Multiple Extends', () => {
        const container = new Container() as Container & { [key: string]: any };
        container.foo = 'foo';

        container.extend('foo', (old: string) => {
            return old + 'bar';
        });

        container.extend('foo', (old: string) => {
            return old + 'baz';
        });

        expect(container.make('foo')).to.eq('foobarbaz');
    });

    it('Works Proxy Delete Extend', () => {
        const container = new Container() as Container & { [key: string]: any };
        container.bind('foo', () => {
            return new (class {
                foo = 'bar';
            })();
        });

        container.extend('foo', (old: { [key: string]: string }) => {
            old.bar = 'baz';
            return old;
        });

        delete container.foo;
        container.forgetExtenders('foo');

        container.bind('foo', () => {
            return 'foo';
        });

        expect(container.make('foo')).to.eq('foo');
    });
});
