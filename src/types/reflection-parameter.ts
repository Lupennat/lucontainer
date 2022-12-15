export default interface ReflectionParameter {
    className: string;
    name: string;
    isVariadic: boolean;
    allowsNull: boolean;
    hasDefault: boolean;
    rawDefaultValue: undefined | any;
    index: number;
    type?: any;
}
