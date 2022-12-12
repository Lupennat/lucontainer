import { expect } from 'chai';
import Container, { constructable } from '../../src';

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
class Test {}

describe('Container Resolving Callback', () => {
    it('Works Resolving Callbacks Are Called For Specific Abstracts', () => {
        const container = new Container();
        container.resolving('foo', (obj: { [key: string]: string }) => {
            obj.name = 'claudio';
            return obj;
        });
        container.bind('foo', () => {
            return new (class {})();
        });
        const instance = container.make<{ [key: string]: string }>('foo');
        expect(instance.name).to.eq('claudio');
    });

    it('Works Resolving Callbacks Are Called', () => {
        const container = new Container();
        container.resolving(Test, (obj: { [key: string]: string }) => {
            obj.name = 'claudio';
            return obj;
        });
        container.bind('foo', () => {
            return new Test();
        });
        const instance = container.make<{ [key: string]: string }>('foo');
        expect(instance.name).to.eq('claudio');
    });

    it('Works Resolving Callbacks Should Be Fired When Called With Aliases', () => {
        const container = new Container();
        container.alias(Test, 'test');
        container.resolving('test', (obj: { [key: string]: string }) => {
            obj.name = 'claudio';
            return obj;
        });
        container.bind('foo', () => {
            return new Test();
        });
        const instance = container.make<{ [key: string]: string }>('foo');
        expect(instance.name).to.eq('claudio');
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
        expect(callCounter).to.eq(0);

        container.make(ResolvingImplementationStubThree);
        expect(callCounter).to.eq(0);
    });

    it('Works Resolving Callbacks Are Called Once For Implementation', () => {
        const container = new Container();
        let callCounter = 0;
        container.resolving('ResolvingContractStub', () => {
            callCounter++;
        });

        container.bind('ResolvingContractStub', ResolvingImplementationStub);
        container.make(ResolvingImplementationStub);
        expect(callCounter).to.eq(1);

        container.make(ResolvingImplementationStub);
        expect(callCounter).to.eq(2);
    });

    it('Works Global Resolving Callbacks Are Called Once For Implementation', () => {
        const container = new Container();
        let callCounter = 0;
        container.resolving(() => {
            callCounter++;
        });

        container.bind('ResolvingContractStub', ResolvingImplementationStub);
        container.make(ResolvingImplementationStub);
        expect(callCounter).to.eq(1);

        container.make(ResolvingImplementationStub);
        expect(callCounter).to.eq(2);
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
        expect(callCounter).to.eq(1);

        container.make(ResolvingImplementationStub);
        expect(callCounter).to.eq(2);

        container.make('ResolvingContractStub');
        expect(callCounter).to.eq(3);
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
        expect(callCounter).to.eq(1);
    });

    it('Works Resolving Callbacks Are Canceled When Interfaces Gets Bound To Some Other Concrete', () => {
        const container = new Container();

        container.bind('ResolvingContractStub', ResolvingImplementationStub);

        let callCounter = 0;
        container.resolving(ResolvingImplementationStub, () => {
            callCounter++;
        });

        container.make('ResolvingContractStub');
        expect(callCounter).to.eq(1);

        container.bind('ResolvingContractStub', ResolvingImplementationStubTwo);

        container.make('ResolvingContractStub');
        expect(callCounter).to.eq(1);
    });

    it('Works Resolving Callbacks Are Called Once For String Abstractions', () => {
        const container = new Container();

        let callCounter = 0;
        container.resolving('foo', () => {
            callCounter++;
        });

        container.bind('foo', ResolvingImplementationStub);

        container.make('foo');
        expect(callCounter).to.eq(1);

        container.make('foo');
        expect(callCounter).to.eq(2);
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
        expect(callCounter).to.eq(1);

        container.make('foo');
        expect(callCounter).to.eq(2);

        container.make('bar');
        expect(callCounter).to.eq(3);

        container.make('ResolvingContractStub');
        expect(callCounter).to.eq(4);
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
        expect(callCounter).to.eq(1);

        container.make(ResolvingImplementationStub);
        expect(callCounter).to.eq(2);

        container.make(ResolvingImplementationStub);
        expect(callCounter).to.eq(3);

        container.make('ResolvingContractStub');
        expect(callCounter).to.eq(4);
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
        expect(callCounter).to.eq(1);

        container.make(ResolvingImplementationStub);
        expect(callCounter).to.eq(2);

        container.make(ResolvingImplementationStub);
        expect(callCounter).to.eq(3);

        container.make('ResolvingContractStub');
        expect(callCounter).to.eq(4);
    });

    it('Works Parameters Passed Into Resolving Callbacks', () => {
        const container = new Container();

        let callCounter = 0;
        container.resolving('ResolvingContractStub', (obj, app) => {
            expect(obj).to.be.instanceOf(ResolvingImplementationStubTwo);
            expect(app === container).to.be.true;
        });

        container.afterResolving('ResolvingContractStub', (obj, app) => {
            expect(obj).to.be.instanceOf(ResolvingImplementationStubTwo);
            expect(app === container).to.be.true;
        });

        container.afterResolving((obj, app) => {
            expect(obj).to.be.instanceOf(ResolvingImplementationStubTwo);
            expect(app === container).to.be.true;
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
        expect(callCounter).to.eq(1);

        container.bind('ResolvingContractStub', ResolvingImplementationStubTwo);
        expect(callCounter).to.eq(2);

        container.make(ResolvingImplementationStubTwo);
        expect(callCounter).to.eq(3);

        container.bind('ResolvingContractStub', () => {
            return new ResolvingImplementationStubTwo();
        });
        expect(callCounter).to.eq(4);

        container.make('ResolvingContractStub');
        expect(callCounter).to.eq(5);
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
        expect(callCounter).to.eq(1);

        // it should call the callback for interface
        container.make(ResolvingImplementationStub);
        expect(callCounter).to.eq(2);

        // should call the callback for the interface it implements
        // plus the callback for ResolvingImplementationStubTwo.
        container.make(ResolvingImplementationStubTwo);
        expect(callCounter).to.eq(4);
    });

    it('Works Resolving Callbacks Are Called For Interfaces', () => {
        const container = new Container();

        let callCounter = 0;
        container.resolving('ResolvingContractStub', () => {
            callCounter++;
        });

        container.bind('ResolvingContractStub', ResolvingImplementationStub);

        container.make('ResolvingContractStub');
        expect(callCounter).to.eq(1);
    });

    it('Works Resolving Callbacks Are Called For Concretes When Attached On Interface', () => {
        const container = new Container();

        let callCounter = 0;
        container.resolving('ResolvingContractStub', () => {
            callCounter++;
        });

        container.bind('ResolvingContractStub', ResolvingImplementationStub);

        container.make('ResolvingContractStub');
        expect(callCounter).to.eq(1);

        container.make(ResolvingImplementationStub);
        expect(callCounter).to.eq(2);
    });

    it('Works Resolving Callbacks Are Called For Concretes When Attached On Concretes', () => {
        const container = new Container();

        let callCounter = 0;
        container.resolving(ResolvingImplementationStub, () => {
            callCounter++;
        });

        container.bind('ResolvingContractStub', ResolvingImplementationStub);

        container.make('ResolvingContractStub');
        expect(callCounter).to.eq(1);

        container.make(ResolvingImplementationStub);
        expect(callCounter).to.eq(2);
    });

    it('Works Resolving Callbacks Are Called For Concretes With No Bindings', () => {
        const container = new Container();

        let callCounter = 0;
        container.resolving(ResolvingImplementationStub, () => {
            callCounter++;
        });

        container.make(ResolvingImplementationStub);
        expect(callCounter).to.eq(1);

        container.make(ResolvingImplementationStub);
        expect(callCounter).to.eq(2);
    });

    it('Works Resolving Callbacks Are Called For Interfaces With No Bindings', () => {
        const container = new Container();

        let callCounter = 0;
        container.resolving('ResolvingContractStub', () => {
            callCounter++;
        });

        container.make(ResolvingImplementationStub);
        expect(callCounter).to.eq(1);

        container.make(ResolvingImplementationStub);
        expect(callCounter).to.eq(2);
    });

    it('Works After Resolving Callbacks Are Called Once For Implementation', () => {
        const container = new Container();

        let callCounter = 0;
        container.afterResolving('ResolvingContractStub', () => {
            callCounter++;
        });

        container.bind('ResolvingContractStub', ResolvingImplementationStub);

        container.make(ResolvingImplementationStub);
        expect(callCounter).to.eq(1);

        container.make('ResolvingContractStub');
        expect(callCounter).to.eq(2);
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
        expect(callCounter).to.eq(0);

        container.make(ResolvingImplementationStubThree);
        expect(callCounter).to.eq(0);
    });

    it('Works Before Resolving Callbacks Are Called', () => {
        const container = new Container();

        container.bind('ResolvingContractStub', ResolvingImplementationStub);

        let callCounter = 0;
        container.beforeResolving('ResolvingContractStub', () => {
            callCounter++;
        });

        container.make(ResolvingImplementationStub);
        expect(callCounter).to.eq(1);

        container.make('ResolvingContractStub');
        expect(callCounter).to.eq(2);
    });

    it('Works Global Before Resolving Callbacks Are Called', () => {
        const container = new Container();

        let callCounter = 0;
        container.beforeResolving(() => {
            callCounter++;
        });

        container.make(ResolvingImplementationStub);
        expect(callCounter).to.eq(1);
    });
});
