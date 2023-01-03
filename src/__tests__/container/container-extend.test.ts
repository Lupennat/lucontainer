import Container from '../../container';
import { constructable } from '../../decorators';

@constructable()
class ContainerLazyExtendStub {
    public static initialized = false;

    public init(): void {
        ContainerLazyExtendStub.initialized = true;
    }
}

describe('Container Extend', () => {
    it('Works Bindings', () => {
        let container = new Container();
        container.bind('foo', () => 'foo');
        container.extend('foo', ({ instance: old }: { instance: string }) => {
            return old + 'bar';
        });

        expect(container.make('foo')).toBe('foobar');
        container = new Container();
        container.singleton('foo', () => {
            return {
                name: 'claudio'
            };
        });
        container.extend('foo', ({ instance: old }: { instance: { [key: string]: any } }) => {
            old.age = 38;
            return old;
        });

        const res = container.make<{ [key: string]: any }>('foo');
        expect(res.name).toBe('claudio');
        expect(res.age).toBe(38);
        expect(res === container.make('foo')).toBeTruthy();
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
        container.extend('foo', ({ instance: old }: { instance: { [key: string]: any } }) => {
            old.bar = 'bar';
            return old;
        });

        container.extend('foo', ({ instance: old }: { instance: { [key: string]: any } }) => {
            old.baz = 'baz';
            return old;
        });

        expect(container.make<{ [key: string]: any }>('foo').foo).toBe('foo');
        expect(container.make<{ [key: string]: any }>('foo').bar).toBe('bar');
        expect(container.make<{ [key: string]: any }>('foo').baz).toBe('baz');
    });

    it('Works Extend Is Lazy Initialized', () => {
        ContainerLazyExtendStub.initialized = false;
        const container = new Container();
        container.bind(ContainerLazyExtendStub);

        container.extend(ContainerLazyExtendStub, ({ instance: old }: { instance: ContainerLazyExtendStub }) => {
            old.init();
            return old;
        });

        expect(ContainerLazyExtendStub.initialized).toBeFalsy();
        container.make(ContainerLazyExtendStub);
        expect(ContainerLazyExtendStub.initialized).toBeTruthy();
    });

    it('Works Extend Can Be Called Before Bind', () => {
        ContainerLazyExtendStub.initialized = false;
        const container = new Container();
        container.extend('foo', ({ instance: old }: { instance: string }) => {
            return old + 'bar';
        });
        container.bind('foo', () => 'foo');
        expect(container.make('foo')).toBe('foobar');
    });

    it('Works Extend Instance Rebind Callback', () => {
        let rebind = false;
        const container = new Container();
        container.rebinding('foo', () => {
            rebind = true;
        });
        const obj = new (class {})();
        container.instance('foo', obj);
        container.extend('foo', ({ instance: old }) => {
            return old;
        });

        expect(rebind).toBeTruthy();
    });

    it('Works Extend Bind Rebind Callback', () => {
        let rebind = false;
        const container = new Container();

        container.rebinding('foo', () => {
            rebind = true;
        });

        container.bind('foo', () => {
            return new (class {})();
        });

        expect(rebind).toBeFalsy();

        container.make('foo');
        container.extend('foo', old => {
            return old;
        });

        expect(rebind).toBeTruthy();
    });

    it('Extension Works On Aliases Bindings', () => {
        const container = new Container();

        container.singleton('something', () => {
            return 'some value';
        });
        container.alias('something', 'something-alias');

        container.extend('something-alias', ({ instance: old }: { instance: string }) => {
            return old + ' extended';
        });

        expect(container.make('something')).toBe('some value extended');
    });

    it('Works Multiple Extends', () => {
        const container = new Container();
        container.bind('foo', () => 'foo');

        container.extend('foo', ({ instance: old }: { instance: string }) => {
            return old + 'bar';
        });

        container.extend('foo', ({ instance: old }: { instance: string }) => {
            return old + 'baz';
        });

        expect(container.make('foo')).toBe('foobarbaz');
    });
});
