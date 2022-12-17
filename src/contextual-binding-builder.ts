import LogicError from './errors/logic-error';
import ContainerI, { ContainerNewable } from './types/container';
import {
    ContextualAbstract,
    default as ContextualBindingBuilderI,
    ContextualImplementation
} from './types/contextual-binding-builder';

import { arrayWrap } from './utils';

class ContextualBindingBuilder implements ContextualBindingBuilderI {
    protected need: ContextualAbstract | null = null;

    constructor(protected container: ContainerI, protected concrete: ContainerNewable[]) {}

    public needs(abstract: ContextualAbstract): this {
        this.need = abstract;

        return this;
    }

    public give(implementation: ContextualImplementation): void {
        this.validateNeed();
        for (const concrete of arrayWrap(this.concrete)) {
            this.container.addContextualBinding(concrete, this.need as ContextualAbstract, implementation);
        }
    }

    public giveTagged(tag: string): void {
        this.give(function ({ container }: { container: ContainerI }) {
            return container.tagged(tag);
        });
    }

    protected validateNeed(): void {
        if (this.need == null) {
            throw new LogicError('Please provide a need, before give!');
        }
    }
}

export default ContextualBindingBuilder;
