import constructable from './constructable';
import methodable from './methodable';

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

function annotate(
    target: Function | Object,
    propertyKeyOrInterfaces: string | Symbol | string[] = [],
    parameters: any[] = []
): Function | PropertyDescriptor {
    if (typeof propertyKeyOrInterfaces === 'string' || typeof propertyKeyOrInterfaces === 'string') {
        return decorate(
            [methodable(), Reflect.metadata('design:paramtypes', parameters)],
            target,
            propertyKeyOrInterfaces as string | symbol
        ) as PropertyDescriptor;
    } else {
        return decorate(
            [
                constructable(...(propertyKeyOrInterfaces as string[])),
                Reflect.metadata('design:paramtypes', parameters)
            ],
            target
        ) as Function;
    }
}

export default annotate;
