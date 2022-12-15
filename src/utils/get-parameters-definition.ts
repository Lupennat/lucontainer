import { parse } from 'acorn';
import { types } from 'node:util';
import { ReflectionParameter } from '../types';

function beautifyString(str: string): string {
    return str
        .replace(/((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm, '')
        .replace(/\s/gm, ' ')
        .replace(/\s\s+/g, ' ')
        .trim();
}

function assignParameterTypeByRawDefault(parameter: ReflectionParameter): ReflectionParameter {
    switch (typeof parameter.rawDefaultValue) {
        case 'string':
            parameter.type = String;
            return parameter;
        case 'number':
            parameter.type = Number;
            return parameter;
        default:
            return parameter;
    }
}

function acornParametersToStringParameters(acornParams: acorn.Node[], className: string): ReflectionParameter[] {
    const parameters: ReflectionParameter[] = [];
    for (let x = 0; x < acornParams.length; x++) {
        const acornParam = acornParams[x];
        const param: ReflectionParameter = {
            className,
            name: '',
            isVariadic: false,
            allowsNull: false,
            hasDefault: false,
            rawDefaultValue: undefined,
            index: x,
            type: undefined
        };

        let left, right;

        switch (acornParam.type) {
            case 'Identifier':
                // @ts-expect-error acorn types are not defined well should be improved in the future
                param.name = acornParam.name;
                break;
            case 'AssignmentPattern':
                // @ts-expect-error acorn types are not defined well should be improved in the future
                left = acornParam.left;
                // @ts-expect-error acorn types are not defined well should be improved in the future
                right = acornParam.right;
                param.name = left.type === 'ObjectPattern' ? '[Destructured]' : left.name;
                param.hasDefault = true;
                param.rawDefaultValue = undefined;
                if (right.type === 'Literal') {
                    param.rawDefaultValue = right.value;
                }

                if (right.type === 'ArrayExpression') {
                    param.rawDefaultValue = right.elements.length === 0 ? [] : undefined;
                }

                if (right.type === 'ObjectExpression') {
                    param.rawDefaultValue = right.properties.length === 0 ? {} : undefined;
                }

                if (
                    (right.type === 'Literal' && right.raw === 'null') ||
                    (right.type === 'Identifier' && right.name === 'undefined')
                ) {
                    param.allowsNull = true;
                }
                break;
            case 'RestElement':
                // @ts-expect-error acorn types are not defined well should be improved in the future
                param.name = acornParam.argument.name;
                param.isVariadic = true;
                break;
            case 'ObjectPattern':
                param.name = '[Destructured]';
                break;
        }

        parameters.push(assignParameterTypeByRawDefault(param));
    }

    return parameters;
}

/**
 * Return parameters definition from a function
 */
function getParametersDefinition(fn: Function, className = '', isConstructorFunction = false): ReflectionParameter[] {
    let fnStr = beautifyString(
        isConstructorFunction
            ? Function.prototype.toString.call(fn.prototype.constructor)
            : Function.prototype.toString.call(fn)
    );

    if (types.isAsyncFunction(fn)) {
        fnStr = fnStr.replace('async', '').trim();
    }

    if (fnStr.startsWith('[')) {
        const regex = /\](?=([^"']*"[^"']*")*[^"']*$)/g;
        const end = regex.exec(fnStr) as RegExpExecArray;
        const toReplace = fnStr.substring(0, end.index + 1);
        fnStr = fnStr.replace(toReplace, 'replaced');
    }

    if (isConstructorFunction) {
        // class {} is not parsable
        // try to make a stupid class replace
        fnStr = fnStr
            .replace('class {', 'class ' + (className === '' ? 'anonymous' : className) + ' {')
            .replace('class{', 'class ' + (className === '' ? 'anonymous' : className) + ' {');

        // fn from variable should not have name
        fnStr = fnStr.startsWith('function')
            ? fnStr
                  .replace('function(', 'function ' + fn.name + ' (')
                  .replace('function (', 'function ' + fn.name + ' (')
            : fnStr;

        const ast = parse(fnStr, { ecmaVersion: 2022 });
        // @ts-expect-error acorn types are not defined well should be improved in the future
        let node = ast.body[0];

        if (node.type === 'ClassDeclaration') {
            node = node.body.body.find((node: any) => {
                return node.kind === 'constructor';
            });
            if (node != null) {
                node = node.value;
            } else {
                node = { params: [] };
            }
        }
        return acornParametersToStringParameters(node.params, className);
    }

    if (fn.name !== '') {
        fnStr = fnStr.startsWith('function') ? fnStr : 'function ' + fnStr;
        const ast = parse(fnStr, { ecmaVersion: 2022 });
        // @ts-expect-error acorn types are not defined well should be improved in the future
        const node: any = ast.body[0];

        return acornParametersToStringParameters(node.params, className);
    }

    const ast = parse('const t = ' + fnStr, { ecmaVersion: 2022 });
    // @ts-expect-error acorn types are not defined well should be improved in the future
    let node: any = ast.body[0];
    node = node.declarations[0];
    node = node.init;

    return acornParametersToStringParameters(node.params, className);
}

export default getParametersDefinition;
