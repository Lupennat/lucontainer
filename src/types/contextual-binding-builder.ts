import { ContainerConcreteFunction, ContainerNewable } from './container';

export type ContextualAbstract<T = unknown> = string | symbol | ContainerNewable<T>;
export type ContextualImplementation = ContainerConcreteFunction | any;

export default interface ContextualBindingBuilder {
    /**
     * Define the abstract target that depends on the context.
     */
    needs: (abstract: ContextualAbstract) => this;

    /**
     * Define the implementation for the contextual binding.
     */
    give: (implementation: ContextualImplementation) => void;

    /**
     * Define tagged services to be used as the implementation for the contextual binding.
     */
    giveTagged: (tag: string) => void;
}
