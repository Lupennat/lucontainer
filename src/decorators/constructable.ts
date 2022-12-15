import { getParametersDefinition } from '../utils';

function constructable(...interfaces: Array<string | Symbol>) {
    return function <TFunction extends Function>(target: TFunction): TFunction | undefined {
        const types = Reflect.getMetadata('design:paramtypes', target);
        Reflect.defineMetadata('design:paramtypes', types, target);
        const definitions = getParametersDefinition(target, target.name, true);
        Reflect.defineMetadata('design:paramdefinitions', definitions, target);
        Reflect.defineMetadata('design:interfaces', interfaces, target);
        return target;
    };
}

export default constructable;
