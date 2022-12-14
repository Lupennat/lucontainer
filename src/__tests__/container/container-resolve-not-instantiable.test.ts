/* eslint-disable @typescript-eslint/no-empty-interface */

import Container from '../../container';
import { constructable, inject } from '../../decorators';

interface TestInterface {}

@constructable()
class ParentClass {
    constructor(public testObject: TestInterface | null = null, public i: number = 0) {}
}

@constructable()
class ChildClass {
    public objects: TestInterface[];
    constructor(@inject('TestInterface') ...objects: TestInterface[]) {
        this.objects = objects;
    }
}

@constructable()
class VariadicParentClass {
    constructor(public child: ChildClass, public i: number = 0) {}
}

@constructable()
class VariadicPrimitive {
    public params: any[];
    constructor(...params: any[]) {
        this.params = params;
    }
}

describe('Container Resolve Not Instantiable', () => {
    it('Works Resolving Not Instantiable With Default Removes Withs', () => {
        const container = new Container();
        const obj = container.make(ParentClass, { i: 42 });
        expect(obj.i).toBe(42);
    });

    it('Works Resolving Not Instantiable With Variadic Removes Withs', () => {
        const container = new Container();
        const parent = container.make(VariadicParentClass, { i: 42 });
        expect(parent.child.objects.length).toBe(0);
        expect(parent.i).toBe(42);
    });

    it('Works Resolve Variadic Primitive', () => {
        const container = new Container();
        const parent = container.make(VariadicPrimitive);
        expect(parent.params).toEqual([]);
    });
});
