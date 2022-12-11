import { getParametersDefinition } from './utils';

export function methodable() {
    return function <T>(
        target: Object,
        propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<T>
    ): TypedPropertyDescriptor<T> | undefined {
        const types = Reflect.getMetadata('design:paramtypes', target, propertyKey) ?? [];
        Reflect.defineMetadata('design:paramtypes', types, target, propertyKey);
        const definitions = getParametersDefinition(
            (target as any)[propertyKey] as Function,
            'name' in target ? (target.name as string) : undefined
        );
        Reflect.defineMetadata('design:paramdefinitions', definitions, target, propertyKey);
        return descriptor;
    };
}

export function constructable() {
    return function <TFunction extends Function>(target: TFunction): TFunction | undefined {
        const types = Reflect.getMetadata('design:paramtypes', target) ?? [];
        Reflect.defineMetadata('design:paramtypes', types, target);
        const definitions = getParametersDefinition(target, target.name, true);
        Reflect.defineMetadata('design:paramdefinitions', definitions, target);
        return target;
    };
}

export function inject(value: any) {
    return function (target: Object, propertyKey: string | symbol, parameterIndex: number): void {
        const types = Reflect.getMetadata('design:paramtypes', target, propertyKey) ?? [];
        types[parameterIndex] = value;
        Reflect.defineMetadata('design:paramtypes', types, target, propertyKey);
    };
}

function decorate(
    decorators: Array<PropertyDecorator | MethodDecorator | ClassDecorator>,
    target: Function | Object,
    propertyKey?: string | symbol,
    attributes?: PropertyDescriptor
): Function | PropertyDescriptor {
    if (propertyKey == null) {
        return Reflect.decorate(decorators as ClassDecorator[], target as Function);
    }
    return Reflect.decorate(decorators as Array<PropertyDecorator | MethodDecorator>, target, propertyKey, attributes);
}

export function annotate(
    target: Function,
    propertyKeyOrParams: string | Symbol | any[] = [],
    parameters: any[] = []
): Function | PropertyDescriptor {
    if (typeof propertyKeyOrParams === 'string' || typeof propertyKeyOrParams === 'string') {
        return decorate(
            [methodable(), Reflect.metadata('design:paramtypes', parameters)],
            target,
            propertyKeyOrParams as string | symbol
        ) as PropertyDescriptor;
    } else {
        return decorate(
            [constructable(), Reflect.metadata('design:paramtypes', propertyKeyOrParams as any[])],
            target
        ) as Function;
    }
}
