/* eslint-disable @typescript-eslint/no-empty-interface */

import Container from '../../container';
import { constructable } from '../../decorators';

interface ResolvingContractStub {
    //
}

@constructable('ResolvingContractStub')
class ResolvingImplementationStub implements ResolvingContractStub {
    //
}

@constructable('ResolvingContractStub')
class ResolvingImplementationStubTwo implements ResolvingContractStub {
    //
}

class ResolvingImplementationStubThree implements ResolvingContractStub {
    //
}

@constructable()
class AbstractClass {}

@constructable()
class ImplementAbstract extends AbstractClass {}

@constructable()
class Test {}

describe('Container Resolving Callback', () => {
    it('Works Resolving Callbacks Are Called For Specific Abstracts', () => {
        const container = new Container();
        container.resolving('foo', ({ instance: obj }: { instance: { [key: string]: string } }) => {
            obj.name = 'claudio';
            return obj;
        });
        container.bind('foo', () => {
            return new (class {})();
        });
        const instance = container.make<{ [key: string]: string }>('foo');
        expect(instance.name).toBe('claudio');
    });

    it('Works Resolving Callbacks Are Called', () => {
        const container = new Container();
        container.resolving(Test, ({ instance: obj }: { instance: { [key: string]: string } }) => {
            obj.name = 'claudio';
            return obj;
        });
        container.bind('foo', () => {
            return new Test();
        });
        const instance = container.make<{ [key: string]: string }>('foo');
        expect(instance.name).toBe('claudio');
    });

    it('Works Resolving Callbacks Should Be Fired When Called With Aliases', () => {
        const container = new Container();
        container.alias(Test, 'test');
        container.resolving('test', ({ instance: obj }: { instance: { [key: string]: string } }) => {
            obj.name = 'claudio';
            return obj;
        });
        container.bind('foo', () => {
            return new Test();
        });
        const instance = container.make<{ [key: string]: string }>('foo');
        expect(instance.name).toBe('claudio');
    });

    it('Does Not Work Resolving Callbacks For Implementation Not Constructable', () => {
        const container = new Container();
        let callCounter = 0;
        container.resolving('ResolvingContractStub', () => {
            callCounter++;
        });

        container.bind('ResolvingContractStub', ResolvingImplementationStubThree);

        container.bind(ResolvingImplementationStubThree, () => {
            return new ResolvingImplementationStubThree();
        });

        container.make(ResolvingImplementationStubThree);
        expect(callCounter).toBe(0);

        container.make(ResolvingImplementationStubThree);
        expect(callCounter).toBe(0);
    });

    it('Works Resolving Callbacks Are Called Once For Implementation', () => {
        const container = new Container();
        let callCounter = 0;
        container.resolving('ResolvingContractStub', () => {
            callCounter++;
        });

        container.bind('ResolvingContractStub', ResolvingImplementationStub);
        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(1);

        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(2);
    });

    it('Works Global Resolving Callbacks Are Called Once For Implementation', () => {
        const container = new Container();
        let callCounter = 0;
        container.resolving(() => {
            callCounter++;
        });

        container.bind('ResolvingContractStub', ResolvingImplementationStub);
        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(1);

        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(2);
    });

    it('Works Resolving Callbacks Are Called Once For Singleton Concretes', () => {
        const container = new Container();
        let callCounter = 0;
        container.resolving('ResolvingContractStub', () => {
            callCounter++;
        });

        container.bind('ResolvingContractStub', ResolvingImplementationStub);
        container.bind(ResolvingImplementationStub);

        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(1);

        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(2);

        container.make('ResolvingContractStub');
        expect(callCounter).toBe(3);
    });

    it('Works Resolving Callbacks Can Still Be Added After The First Resolution', () => {
        const container = new Container();

        container.bind('ResolvingContractStub', ResolvingImplementationStub);
        container.make(ResolvingImplementationStub);

        let callCounter = 0;
        container.resolving('ResolvingContractStub', () => {
            callCounter++;
        });

        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(1);
    });

    it('Works Resolving Callbacks Are Canceled When Interfaces Gets Bound To Some Other Concrete', () => {
        const container = new Container();

        container.bind('ResolvingContractStub', ResolvingImplementationStub);

        let callCounter = 0;
        container.resolving(ResolvingImplementationStub, () => {
            callCounter++;
        });

        container.make('ResolvingContractStub');
        expect(callCounter).toBe(1);

        container.bind('ResolvingContractStub', ResolvingImplementationStubTwo);

        container.make('ResolvingContractStub');
        expect(callCounter).toBe(1);
    });

    it('Works Resolving Callbacks Are Called Once For String Abstractions', () => {
        const container = new Container();

        let callCounter = 0;
        container.resolving('foo', () => {
            callCounter++;
        });

        container.bind('foo', ResolvingImplementationStub);

        container.make('foo');
        expect(callCounter).toBe(1);

        container.make('foo');
        expect(callCounter).toBe(2);
    });

    it('Works Resolving Callbacks For Concretes Are Called Once For String Abstractions', () => {
        const container = new Container();

        let callCounter = 0;
        container.resolving(ResolvingImplementationStub, () => {
            callCounter++;
        });

        container.bind('foo', ResolvingImplementationStub);
        container.bind('bar', ResolvingImplementationStub);
        container.bind('ResolvingContractStub', ResolvingImplementationStub);

        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(1);

        container.make('foo');
        expect(callCounter).toBe(2);

        container.make('bar');
        expect(callCounter).toBe(3);

        container.make('ResolvingContractStub');
        expect(callCounter).toBe(4);
    });

    it('Works Resolving Callbacks Are Called Once For Implementation', () => {
        const container = new Container();

        let callCounter = 0;
        container.resolving('ResolvingContractStub', () => {
            callCounter++;
        });

        container.bind('ResolvingContractStub', () => {
            return new ResolvingImplementationStub();
        });

        container.make('ResolvingContractStub');
        expect(callCounter).toBe(1);

        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(2);

        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(3);

        container.make('ResolvingContractStub');
        expect(callCounter).toBe(4);
    });

    it('Works Rebinding Does Not Affect Resolving Callbacks', () => {
        const container = new Container();

        let callCounter = 0;
        container.resolving('ResolvingContractStub', () => {
            callCounter++;
        });

        container.bind('ResolvingContractStub', ResolvingImplementationStub);
        container.bind('ResolvingContractStub', () => {
            return new ResolvingImplementationStub();
        });

        container.make('ResolvingContractStub');
        expect(callCounter).toBe(1);

        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(2);

        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(3);

        container.make('ResolvingContractStub');
        expect(callCounter).toBe(4);
    });

    it('Works Parameters Passed Into Resolving Callbacks', () => {
        const container = new Container();

        container.resolving('ResolvingContractStub', ({ instance: obj, container: app }) => {
            expect(obj).toBeInstanceOf(ResolvingImplementationStubTwo);
            expect(app === container).toBeTruthy();
        });

        container.afterResolving('ResolvingContractStub', ({ instance: obj, container: app }) => {
            expect(obj).toBeInstanceOf(ResolvingImplementationStubTwo);
            expect(app === container).toBeTruthy();
        });

        container.afterResolving(({ instance: obj, container: app }) => {
            expect(obj).toBeInstanceOf(ResolvingImplementationStubTwo);
            expect(app === container).toBeTruthy();
        });

        container.bind('ResolvingContractStub', ResolvingImplementationStubTwo);
        container.make(ResolvingImplementationStubTwo);
    });

    it('Works Resolving Callbacks Are Call When Rebind Happen For Resolved Abstract', () => {
        const container = new Container();

        let callCounter = 0;
        container.resolving('ResolvingContractStub', () => {
            callCounter++;
        });

        container.bind('ResolvingContractStub', ResolvingImplementationStub);

        container.make('ResolvingContractStub');
        expect(callCounter).toBe(1);

        container.bind('ResolvingContractStub', ResolvingImplementationStubTwo);
        expect(callCounter).toBe(2);

        container.make(ResolvingImplementationStubTwo);
        expect(callCounter).toBe(3);

        container.bind('ResolvingContractStub', () => {
            return new ResolvingImplementationStubTwo();
        });
        expect(callCounter).toBe(4);

        container.make('ResolvingContractStub');
        expect(callCounter).toBe(5);
    });

    it('Works Rebinding Does Not Affect Multiple Resolving Callbacks', () => {
        const container = new Container();

        let callCounter = 0;
        container.resolving('ResolvingContractStub', () => {
            callCounter++;
        });

        container.resolving(ResolvingImplementationStubTwo, () => {
            callCounter++;
        });

        container.bind('ResolvingContractStub', ResolvingImplementationStub);

        // it should call the callback for interface
        container.make('ResolvingContractStub');
        expect(callCounter).toBe(1);

        // it should call the callback for interface
        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(2);

        // should call the callback for the interface it implements
        // plus the callback for ResolvingImplementationStubTwo.
        container.make(ResolvingImplementationStubTwo);
        expect(callCounter).toBe(4);
    });

    it('Works Resolving Callbacks Are Called For Interfaces', () => {
        const container = new Container();

        let callCounter = 0;
        container.resolving('ResolvingContractStub', () => {
            callCounter++;
        });

        container.bind('ResolvingContractStub', ResolvingImplementationStub);

        container.make('ResolvingContractStub');
        expect(callCounter).toBe(1);
    });

    it('Works Resolving Callbacks Are Called For Concretes When Attached On Interface', () => {
        const container = new Container();

        let callCounter = 0;
        container.resolving('ResolvingContractStub', () => {
            callCounter++;
        });

        container.bind('ResolvingContractStub', ResolvingImplementationStub);

        container.make('ResolvingContractStub');
        expect(callCounter).toBe(1);

        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(2);
    });

    it('Works Resolving Callbacks Are Called For Concretes When Attached On Concretes', () => {
        const container = new Container();

        let callCounter = 0;
        container.resolving(ResolvingImplementationStub, () => {
            callCounter++;
        });

        container.bind('ResolvingContractStub', ResolvingImplementationStub);

        container.make('ResolvingContractStub');
        expect(callCounter).toBe(1);

        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(2);
    });

    it('Works Resolving Callbacks Are Called For Concretes With No Bindings', () => {
        const container = new Container();

        let callCounter = 0;
        container.resolving(ResolvingImplementationStub, () => {
            callCounter++;
        });

        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(1);

        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(2);
    });

    it('Works Resolving Callbacks Are Called For Interfaces With No Bindings', () => {
        const container = new Container();

        let callCounter = 0;
        container.resolving('ResolvingContractStub', () => {
            callCounter++;
        });

        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(1);

        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(2);
    });

    it('Works After Resolving Callbacks Are Called Once For Implementation', () => {
        const container = new Container();

        let callCounter = 0;
        container.afterResolving('ResolvingContractStub', () => {
            callCounter++;
        });

        container.bind('ResolvingContractStub', ResolvingImplementationStub);

        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(1);

        container.make('ResolvingContractStub');
        expect(callCounter).toBe(2);
    });

    it('Does Not Work Before Resolving Callbacks For Implementation Not Constructable', () => {
        const container = new Container();
        let callCounter = 0;
        container.beforeResolving('ResolvingContractStub', () => {
            callCounter++;
        });

        container.bind('ResolvingContractStub', ResolvingImplementationStubThree);

        container.bind(ResolvingImplementationStubThree, () => {
            return new ResolvingImplementationStubThree();
        });

        container.make(ResolvingImplementationStubThree);
        expect(callCounter).toBe(0);

        container.make(ResolvingImplementationStubThree);
        expect(callCounter).toBe(0);
    });

    it('Works Before Resolving Callbacks Are Called', () => {
        const container = new Container();

        container.bind('ResolvingContractStub', ResolvingImplementationStub);

        let callCounter = 0;
        container.beforeResolving('ResolvingContractStub', () => {
            callCounter++;
        });

        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(1);

        container.make('ResolvingContractStub');
        expect(callCounter).toBe(2);

        container.bind(AbstractClass);

        callCounter = 0;
        container.beforeResolving(AbstractClass, () => {
            callCounter++;
        });

        container.make(ImplementAbstract);
        expect(callCounter).toBe(1);

        container.make(AbstractClass);
        expect(callCounter).toBe(2);

        container.bind(Symbol.for('ResolvingContractStub'), ResolvingImplementationStub);

        callCounter = 0;
        container.beforeResolving(Symbol.for('ResolvingContractStub'), () => {
            callCounter++;
        });

        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(1);

        container.make(Symbol.for('ResolvingContractStub'));
        expect(callCounter).toBe(2);
    });

    it('Works Global Before Resolving Callbacks Are Called', () => {
        const container = new Container();

        let callCounter = 0;
        container.beforeResolving(() => {
            callCounter++;
        });

        container.make(ResolvingImplementationStub);
        expect(callCounter).toBe(1);
    });
});
