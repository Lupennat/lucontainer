function inject(value: any) {
    return function (target: Object, propertyKey: string | symbol, parameterIndex: number): void {
        const types = Reflect.getMetadata('design:paramtypes', target, propertyKey);
        types[parameterIndex] = value;
        Reflect.defineMetadata('design:paramtypes', types, target, propertyKey);
    };
}

export default inject;
