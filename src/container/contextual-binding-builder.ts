import LogicError from '../errors/logic-error';
import {
    Config,
    Container,
    ContainerNewable,
    ContextualAbstract,
    ContextualBindingBuilder as ContextualBindingBuilderContract,
    ContextualImplementation
} from '../types';
import { arrayWrap } from '../utils';

class ContextualBindingBuilder implements ContextualBindingBuilderContract {
    protected need: ContextualAbstract | null = null;

    constructor(protected container: Container, protected concrete: ContainerNewable[]) {}

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
        this.give(function (container: Container) {
            return container.tagged(tag);
        });
    }

    public giveConfig(key: string, defaultValue?: any): void {
        this.give((container: Container) => container.get<Config>('config').get(key, defaultValue));
    }

    protected validateNeed(): void {
        if (this.need == null) {
            throw new LogicError('Please provide a need, before give!');
        }
    }
}

export = ContextualBindingBuilder;
