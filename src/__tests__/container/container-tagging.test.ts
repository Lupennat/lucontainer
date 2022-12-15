/* eslint-disable @typescript-eslint/no-empty-interface */

import Container from '../../container';
import { constructable } from '../../decorators';

interface IContainerTaggedContractStub {
    //
}

@constructable()
class ContainerImplementationTaggedStub implements IContainerTaggedContractStub {
    //
}

@constructable()
class ContainerImplementationTaggedStubTwo implements IContainerTaggedContractStub {
    //
}

describe('Container Tagging', () => {
    afterEach(() => {
        // restore the spy created with spyOn
        jest.restoreAllMocks();
    });

    it('Works Tags', () => {
        let container = new Container();
        container.tag(ContainerImplementationTaggedStub, 'foo', 'bar');
        container.tag(ContainerImplementationTaggedStubTwo, ['foo']);

        expect(container.tagged('bar').length).toBe(1);
        expect(container.tagged('foo').length).toBe(2);

        let fooResults = [];
        for (const foo of container.tagged('foo')) {
            fooResults.push(foo);
        }

        const barResults = [];
        for (const bar of container.tagged('bar')) {
            barResults.push(bar);
        }

        expect(fooResults[0]).toBeInstanceOf(ContainerImplementationTaggedStub);
        expect(barResults[0]).toBeInstanceOf(ContainerImplementationTaggedStub);
        expect(fooResults[1]).toBeInstanceOf(ContainerImplementationTaggedStubTwo);

        container = new Container();
        container.tag([ContainerImplementationTaggedStub, ContainerImplementationTaggedStubTwo], ['foo']);

        fooResults = [];
        for (const foo of container.tagged('foo')) {
            fooResults.push(foo);
        }

        expect(fooResults[0]).toBeInstanceOf(ContainerImplementationTaggedStub);
        expect(fooResults[1]).toBeInstanceOf(ContainerImplementationTaggedStubTwo);
        expect(container.tagged('this_tag_does_not_exist').length).toBe(0);
    });

    it('Works Tagged Services Are Lazy Loaded', () => {
        const container = new Container();
        jest.spyOn(container, 'make').mockReturnValueOnce(new ContainerImplementationTaggedStub());

        container.tag(ContainerImplementationTaggedStub, ['foo']);
        container.tag(ContainerImplementationTaggedStubTwo, ['foo']);

        const fooResults = [];

        for (const foo of container.tagged('foo')) {
            fooResults.push(foo);
        }

        expect(container.tagged('foo').length).toBe(2);
        expect(fooResults[0]).toBeInstanceOf(ContainerImplementationTaggedStub);
    });

    it('Works Lazy Loaded Tagged Services Can Be Looped Over Multiple Times', () => {
        const container = new Container();
        container.tag(ContainerImplementationTaggedStub, ['foo']);
        container.tag(ContainerImplementationTaggedStubTwo, ['foo']);
        const services = container.tagged('foo');
        let fooResults = [];
        for (const foo of services) {
            fooResults.push(foo);
        }

        expect(fooResults[0]).toBeInstanceOf(ContainerImplementationTaggedStub);
        expect(fooResults[1]).toBeInstanceOf(ContainerImplementationTaggedStubTwo);

        fooResults = [];
        for (const foo of services) {
            fooResults.push(foo);
        }

        expect(fooResults[0]).toBeInstanceOf(ContainerImplementationTaggedStub);
        expect(fooResults[1]).toBeInstanceOf(ContainerImplementationTaggedStubTwo);
    });
});
