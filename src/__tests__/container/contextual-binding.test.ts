/* eslint-disable @typescript-eslint/no-empty-interface */
import Container from '../../container';
import { constructable, inject } from '../../decorators';

interface IContainerContextContractStub {
    //
}

@constructable()
class ContainerContextNonContractStub {
    //
}

@constructable()
class ContainerContextConcreteStub {
    //
}

@constructable()
class ContainerContextImplementationStub implements IContainerContextContractStub {
    //
}

@constructable()
class ContainerContextImplementationStubTwo implements IContainerContextContractStub {
    //
}

class ContainerTestContextInjectInstantiations implements IContainerContextContractStub {
    public static instantiations: number;

    constructor() {
        ContainerTestContextInjectInstantiations.instantiations++;
    }
}

@constructable()
class ContainerTestContextInjectOne {
    constructor(@inject('IContainerContextContractStub') public impl: IContainerContextContractStub) {}
}

@constructable()
class ContainerTestContextInjectTwo {
    constructor(@inject('IContainerContextContractStub') public impl: IContainerContextContractStub) {}
}

@constructable()
class ContainerTestContextInjectThree {
    constructor(@inject('IContainerContextContractStub') public impl: IContainerContextContractStub) {}
}

@constructable()
class ContainerContextInjectVariableStub {
    constructor(public concrete: ContainerContextConcreteStub, public something: number) {}
}

@constructable()
class ContainerTestContextWithOptionalInnerDependency {
    constructor(public inner: ContainerTestContextInjectOne | null = null) {}
}

@constructable()
class ContainerTestContextInjectTwoInstances {
    constructor(
        public implOne: ContainerTestContextWithOptionalInnerDependency,
        public implTwo: ContainerTestContextInjectTwo
    ) {}
}

@constructable()
class ContainerTestContextInjectArray {
    constructor(public stubs: any[]) {}
}

@constructable()
class ContainerTestContextInjectVariadic {
    public stubs;
    constructor(@inject('IContainerContextContractStub') ...stubs: IContainerContextContractStub[]) {
        this.stubs = stubs;
    }
}

@constructable()
class ContainerTestContextInjectVariadicAfterNonVariadic {
    public stubs;
    constructor(
        public other: ContainerContextNonContractStub,
        @inject('IContainerContextContractStub') ...stubs: IContainerContextContractStub[]
    ) {
        this.stubs = stubs;
    }
}

describe('Contextual Binding', () => {
    it('Can Inject Different Implementations Depending On Context', () => {
        let container = new Container();
        container.bind('IContainerContextContractStub', ContainerContextImplementationStub);
        container
            .when(ContainerTestContextInjectOne)
            .needs('IContainerContextContractStub')
            .give(ContainerContextImplementationStub);

        container
            .when(ContainerTestContextInjectTwo)
            .needs('IContainerContextContractStub')
            .give(ContainerContextImplementationStubTwo);

        let one = container.make(ContainerTestContextInjectOne);
        let two = container.make(ContainerTestContextInjectTwo);

        expect(one.impl).toBeInstanceOf(ContainerContextImplementationStub);
        expect(two.impl).toBeInstanceOf(ContainerContextImplementationStubTwo);

        /*
         * Test With Closures
         */
        container = new Container();

        container.bind('IContainerContextContractStub', ContainerContextImplementationStub);

        container
            .when(ContainerTestContextInjectOne)
            .needs('IContainerContextContractStub')
            .give(ContainerContextImplementationStub);
        container
            .when(ContainerTestContextInjectTwo)
            .needs('IContainerContextContractStub')
            .give(({ container }: { container: Container }) => {
                return container.make(ContainerContextImplementationStubTwo);
            });

        one = container.make(ContainerTestContextInjectOne);
        two = container.make(ContainerTestContextInjectTwo);

        expect(one.impl).toBeInstanceOf(ContainerContextImplementationStub);
        expect(two.impl).toBeInstanceOf(ContainerContextImplementationStubTwo);
    });

    it('Works For Existing Instanced Bindings', () => {
        const container = new Container();

        container.instance('IContainerContextContractStub', new ContainerContextImplementationStub());

        container
            .when(ContainerTestContextInjectOne)
            .needs('IContainerContextContractStub')
            .give(ContainerContextImplementationStubTwo);

        expect(container.make(ContainerTestContextInjectOne).impl).toBeInstanceOf(
            ContainerContextImplementationStubTwo
        );
    });

    it('Works For Newly Instanced Bindings', () => {
        const container = new Container();

        container
            .when(ContainerTestContextInjectOne)
            .needs('IContainerContextContractStub')
            .give(ContainerContextImplementationStubTwo);

        container.instance('IContainerContextContractStub', new ContainerContextImplementationStub());

        expect(container.make(ContainerTestContextInjectOne).impl).toBeInstanceOf(
            ContainerContextImplementationStubTwo
        );
    });

    it('Works On Existing Aliased Instanced', () => {
        const container = new Container();

        container.instance('stub', new ContainerContextImplementationStub());
        container.alias('stub', 'IContainerContextContractStub');

        container
            .when(ContainerTestContextInjectOne)
            .needs('IContainerContextContractStub')
            .give(ContainerContextImplementationStubTwo);

        expect(container.make(ContainerTestContextInjectOne).impl).toBeInstanceOf(
            ContainerContextImplementationStubTwo
        );
    });

    it('Contextual Binding Works On New Aliased Instanced', () => {
        const container = new Container();

        container
            .when(ContainerTestContextInjectOne)
            .needs('IContainerContextContractStub')
            .give(ContainerContextImplementationStubTwo);

        container.instance('stub', new ContainerContextImplementationStub());
        container.alias('stub', 'IContainerContextContractStub');

        expect(container.make(ContainerTestContextInjectOne).impl).toBeInstanceOf(
            ContainerContextImplementationStubTwo
        );
    });

    it('Works On New Aliased Bindings', () => {
        const container = new Container();

        container
            .when(ContainerTestContextInjectOne)
            .needs('IContainerContextContractStub')
            .give(ContainerContextImplementationStubTwo);

        container.bind('stub', ContainerContextImplementationStub);
        container.alias('stub', 'IContainerContextContractStub');

        expect(container.make(ContainerTestContextInjectOne).impl).toBeInstanceOf(
            ContainerContextImplementationStubTwo
        );
    });

    it('Works For Multiple Classes', () => {
        const container = new Container();

        container.bind('IContainerContextContractStub', ContainerContextImplementationStub);

        container
            .when([ContainerTestContextInjectTwo, ContainerTestContextInjectThree])
            .needs('IContainerContextContractStub')
            .give(ContainerContextImplementationStubTwo);

        expect(container.make(ContainerTestContextInjectOne).impl).toBeInstanceOf(ContainerContextImplementationStub);
        expect(container.make(ContainerTestContextInjectTwo).impl).toBeInstanceOf(
            ContainerContextImplementationStubTwo
        );
        expect(container.make(ContainerTestContextInjectThree).impl).toBeInstanceOf(
            ContainerContextImplementationStubTwo
        );
    });

    it('Doesnt Override Non Contextual Resolution', () => {
        const container = new Container();

        container.instance('stub', new ContainerContextImplementationStub());
        container.alias('stub', 'IContainerContextContractStub');

        container
            .when(ContainerTestContextInjectTwo)
            .needs('IContainerContextContractStub')
            .give(ContainerContextImplementationStubTwo);

        expect(container.make(ContainerTestContextInjectOne).impl).toBeInstanceOf(ContainerContextImplementationStub);
        expect(container.make(ContainerTestContextInjectTwo).impl).toBeInstanceOf(
            ContainerContextImplementationStubTwo
        );
    });

    it('Contextually Bound Instances Are Not Unnecessarily Recreated', () => {
        ContainerTestContextInjectInstantiations.instantiations = 0;

        const container = new Container();

        container.instance('IContainerContextContractStub', new ContainerContextImplementationStub());
        container.instance(ContainerTestContextInjectInstantiations, new ContainerTestContextInjectInstantiations());

        expect(ContainerTestContextInjectInstantiations.instantiations).toBe(1);

        container
            .when(ContainerTestContextInjectOne)
            .needs('IContainerContextContractStub')
            .give(ContainerTestContextInjectInstantiations);

        container.make(ContainerTestContextInjectOne);
        container.make(ContainerTestContextInjectOne);
        container.make(ContainerTestContextInjectOne);
        container.make(ContainerTestContextInjectOne);
        expect(ContainerTestContextInjectInstantiations.instantiations).toBe(1);
    });

    it('Can Inject Simple Variable', () => {
        ContainerTestContextInjectInstantiations.instantiations = 0;

        const container = new Container();
        container.when(ContainerContextInjectVariableStub).needs('something').give(100);
        const instance = container.make(ContainerContextInjectVariableStub);
        expect(instance.something).toBe(100);
    });

    it('Works With Aliased Targets', () => {
        const container = new Container();
        container.bind('IContainerContextContractStub', ContainerContextImplementationStub);
        container.alias('IContainerContextContractStub', 'interface-stub');
        container.alias(ContainerContextImplementationStub, 'stub-1');

        container.when(ContainerTestContextInjectOne).needs('interface-stub').give('stub-1');
        container
            .when(ContainerTestContextInjectTwo)
            .needs('interface-stub')
            .give(ContainerContextImplementationStubTwo);

        const one = container.make(ContainerTestContextInjectOne);
        const two = container.make(ContainerTestContextInjectTwo);

        expect(one.impl).toBeInstanceOf(ContainerContextImplementationStub);
        expect(two.impl).toBeInstanceOf(ContainerContextImplementationStubTwo);
    });

    it('Works For Nested Optional Dependencies', () => {
        const container = new Container();
        container
            .when(ContainerTestContextInjectTwoInstances)
            .needs(ContainerTestContextInjectTwo)
            .give(() => {
                return new ContainerTestContextInjectTwo(new ContainerContextImplementationStubTwo());
            });

        const resolvedInstance = container.make(ContainerTestContextInjectTwoInstances);
        expect(resolvedInstance.implOne).toBeInstanceOf(ContainerTestContextWithOptionalInnerDependency);
        expect(resolvedInstance.implOne.inner).toBeNull();
        expect(resolvedInstance.implTwo).toBeInstanceOf(ContainerTestContextInjectTwo);
        expect(resolvedInstance.implTwo.impl).toBeInstanceOf(ContainerContextImplementationStubTwo);
    });

    it('Works For Variadic Dependencies', () => {
        const container = new Container();
        container
            .when(ContainerTestContextInjectVariadic)
            .needs('IContainerContextContractStub')
            .give(({ container }: { container: Container }) => {
                return [
                    container.make(ContainerContextImplementationStub),
                    container.make(ContainerContextImplementationStubTwo)
                ];
            });

        const resolvedInstance = container.make(ContainerTestContextInjectVariadic);
        expect(resolvedInstance.stubs.length).toBe(2);
        expect(resolvedInstance.stubs[0]).toBeInstanceOf(ContainerContextImplementationStub);
        expect(resolvedInstance.stubs[1]).toBeInstanceOf(ContainerContextImplementationStubTwo);
    });

    it('Works For Variadic Dependencies With Nothing Bound', () => {
        const container = new Container();

        const resolvedInstance = container.make(ContainerTestContextInjectVariadic);
        expect(resolvedInstance.stubs.length).toBe(0);
    });

    it('Works For Variadic After Non Variadic Dependencies', () => {
        const container = new Container();

        container
            .when(ContainerTestContextInjectVariadicAfterNonVariadic)
            .needs('IContainerContextContractStub')
            .give(({ container }: { container: Container }) => {
                return [
                    container.make(ContainerContextImplementationStub),
                    container.make(ContainerContextImplementationStubTwo)
                ];
            });

        const resolvedInstance = container.make(ContainerTestContextInjectVariadicAfterNonVariadic);
        expect(resolvedInstance.stubs.length).toBe(2);
        expect(resolvedInstance.stubs[0]).toBeInstanceOf(ContainerContextImplementationStub);
        expect(resolvedInstance.stubs[1]).toBeInstanceOf(ContainerContextImplementationStubTwo);
    });

    it('Works For Variadic After Non Variadic Dependencies With Nothing Bound', () => {
        const container = new Container();

        const resolvedInstance = container.make(ContainerTestContextInjectVariadicAfterNonVariadic);
        expect(resolvedInstance.stubs.length).toBe(0);
    });

    it('Works For Variadic Dependencies Without Factory', () => {
        const container = new Container();

        container
            .when(ContainerTestContextInjectVariadic)
            .needs('IContainerContextContractStub')
            .give([ContainerContextImplementationStub, ContainerContextImplementationStubTwo]);

        const resolvedInstance = container.make(ContainerTestContextInjectVariadic);
        expect(resolvedInstance.stubs.length).toBe(2);
        expect(resolvedInstance.stubs[0]).toBeInstanceOf(ContainerContextImplementationStub);
        expect(resolvedInstance.stubs[1]).toBeInstanceOf(ContainerContextImplementationStubTwo);
    });

    it('Gives Tags For Array With No Tags Defined', () => {
        const container = new Container();

        container.when(ContainerTestContextInjectArray).needs('stubs').giveTagged('stub');

        // const resolvedInstance = container.make(ContainerTestContextInjectArray);
        // expect(resolvedInstance.stubs.length).toBe(0);
    });

    it('Gives Tags For Variadic With No Tags Defined', () => {
        const container = new Container();

        container.when(ContainerTestContextInjectVariadic).needs('stubs').giveTagged('stub');

        const resolvedInstance = container.make(ContainerTestContextInjectVariadic);
        expect(resolvedInstance.stubs.length).toBe(0);
    });

    it('Gives Tags For Array', () => {
        const container = new Container();

        container.tag([ContainerContextImplementationStub, ContainerContextImplementationStubTwo], 'stub');
        container.when(ContainerTestContextInjectArray).needs('stubs').giveTagged('stub');

        const resolvedInstance = container.make(ContainerTestContextInjectArray);
        expect(resolvedInstance.stubs.length).toBe(2);
        expect(resolvedInstance.stubs[0]).toBeInstanceOf(ContainerContextImplementationStub);
        expect(resolvedInstance.stubs[1]).toBeInstanceOf(ContainerContextImplementationStubTwo);
    });

    it('Gives Tags For Variadic', () => {
        const container = new Container();

        container.tag([ContainerContextImplementationStub, ContainerContextImplementationStubTwo], 'stub');
        container.when(ContainerTestContextInjectVariadic).needs('IContainerContextContractStub').giveTagged('stub');

        const resolvedInstance = container.make(ContainerTestContextInjectVariadic);

        expect(resolvedInstance.stubs.length).toBe(2);
        expect(resolvedInstance.stubs[0]).toBeInstanceOf(ContainerContextImplementationStub);
        expect(resolvedInstance.stubs[1]).toBeInstanceOf(ContainerContextImplementationStubTwo);
    });

    it('Throw Logic Error When Give Is Called Without Need', () => {
        const container = new Container();
        container.when(ContainerTestContextInjectOne).needs('interface-stub').give('stub-1');

        expect(() => {
            container.when(ContainerTestContextInjectTwo).give(ContainerContextImplementationStubTwo);
        }).toThrowError('Please provide a need, before give!');
    });
});
