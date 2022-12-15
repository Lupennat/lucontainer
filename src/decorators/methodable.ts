import { getParametersDefinition } from '../utils';

function methodable() {
    return function <T>(
        target: Object,
        propertyKey: string | symbol,
        descriptor: TypedPropertyDescriptor<T>
    ): TypedPropertyDescriptor<T> | undefined {
        const types = Reflect.getMetadata('design:paramtypes', target, propertyKey);
        Reflect.defineMetadata('design:paramtypes', types, target, propertyKey);
        const definitions = getParametersDefinition((target as any)[propertyKey] as Function, target.constructor.name);
        Reflect.defineMetadata('design:paramdefinitions', definitions, target, propertyKey);
        return descriptor;
    };
}

export default methodable;
