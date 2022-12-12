import { expect } from 'chai';
import * as sinon from 'sinon';
import Container, { constructable } from '../../src';

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
    let sandbox: sinon.SinonSandbox;
    beforeEach(function () {
        sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('Works Tags', () => {
        let container = new Container();
        container.tag(ContainerImplementationTaggedStub, 'foo', 'bar');
        container.tag(ContainerImplementationTaggedStubTwo, ['foo']);

        expect(container.tagged('bar').length).to.eq(1);
        expect(container.tagged('foo').length).to.eq(2);

        let fooResults = [];
        for (const foo of container.tagged('foo')) {
            fooResults.push(foo);
        }

        const barResults = [];
        for (const bar of container.tagged('bar')) {
            barResults.push(bar);
        }

        expect(fooResults[0]).to.be.instanceOf(ContainerImplementationTaggedStub);
        expect(barResults[0]).to.be.instanceOf(ContainerImplementationTaggedStub);
        expect(fooResults[1]).to.be.instanceOf(ContainerImplementationTaggedStubTwo);

        container = new Container();
        container.tag([ContainerImplementationTaggedStub, ContainerImplementationTaggedStubTwo], ['foo']);

        fooResults = [];
        for (const foo of container.tagged('foo')) {
            fooResults.push(foo);
        }

        expect(fooResults[0]).to.be.instanceOf(ContainerImplementationTaggedStub);
        expect(fooResults[1]).to.be.instanceOf(ContainerImplementationTaggedStubTwo);
        expect(container.tagged('this_tag_does_not_exist').length).to.eq(0);
    });

    it('Works Tagged Services Are Lazy Loaded', () => {
        const container = new Container();
        const spiedMake = sandbox.spy(container, 'make');
        container.tag(ContainerImplementationTaggedStub, ['foo']);
        container.tag(ContainerImplementationTaggedStubTwo, ['foo']);

        const fooResults = [];
        for (const foo of container.tagged('foo')) {
            fooResults.push(foo);
        }

        expect(container.tagged('foo').length).to.eq(2);
        expect(fooResults[0]).to.be.instanceOf(ContainerImplementationTaggedStub);
        expect(spiedMake.firstCall.returned(new ContainerImplementationTaggedStub())).to.be.true;
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

        expect(fooResults[0]).to.be.instanceOf(ContainerImplementationTaggedStub);
        expect(fooResults[1]).to.be.instanceOf(ContainerImplementationTaggedStubTwo);

        fooResults = [];
        for (const foo of services) {
            fooResults.push(foo);
        }

        expect(fooResults[0]).to.be.instanceOf(ContainerImplementationTaggedStub);
        expect(fooResults[1]).to.be.instanceOf(ContainerImplementationTaggedStubTwo);
    });
});
