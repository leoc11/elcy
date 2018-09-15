import { GenericType, ValueType } from "../Common/Type";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { IBinaryOperatorExpression } from "../ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { TernaryExpression } from "../ExpressionBuilder/Expression/TernaryExpression";
import { IUnaryOperatorExpression } from "../ExpressionBuilder/Expression/IUnaryOperatorExpression";

export const visitExpression = <T extends IExpression>(source: IExpression, finder: (exp: IExpression) => boolean | void) => {
    if (finder(source) === false) {
        return;
    }

    if ((source as IBinaryOperatorExpression).rightOperand) {
        const binaryOperatorExp = source as IBinaryOperatorExpression;
        visitExpression(binaryOperatorExp.leftOperand, finder);
        visitExpression(binaryOperatorExp.rightOperand, finder);
    }
    else if (source instanceof TernaryExpression) {
        visitExpression(source.logicalOperand, finder);
        visitExpression(source.trueResultOperand, finder);
        visitExpression(source.falseResultOperand, finder);
    }
    else if ((source as IUnaryOperatorExpression).operand) {
        const unaryOperatorExp = source as IUnaryOperatorExpression;
        visitExpression(unaryOperatorExp.operand, finder);
    }
};
export const replaceExpression = <T extends IExpression>(source: IExpression, finder: (exp: IExpression) => IExpression) => {
    const rsource = finder(source);
    if (rsource !== source) {
        return rsource;
    }

    if ((source as IBinaryOperatorExpression).rightOperand) {
        const binaryOperatorExp = source as IBinaryOperatorExpression;
        binaryOperatorExp.leftOperand = replaceExpression(binaryOperatorExp.leftOperand, finder);
        binaryOperatorExp.rightOperand = replaceExpression(binaryOperatorExp.rightOperand, finder);
    }
    else if (source instanceof TernaryExpression) {
        source.logicalOperand = replaceExpression(source.logicalOperand, finder);
        source.trueResultOperand = replaceExpression(source.trueResultOperand, finder);
        source.falseResultOperand = replaceExpression(source.falseResultOperand, finder);
    }
    else if ((source as IUnaryOperatorExpression).operand) {
        const unaryOperatorExp = source as IUnaryOperatorExpression;
        unaryOperatorExp.operand = replaceExpression(unaryOperatorExp.operand, finder);
    }
    return source;
};
export const isValue = (data: any): data is ValueType => {
    return [Number, String, Date].contains(data.constructor);
};
export const isValueType = <T>(type: GenericType<T>) => {
    return [Number, String, Date].contains(type as any);
};
export const isNotNull = (value: any) => {
    return value !== null && value !== undefined;
};
export const isNativeFunction = (fn: Function) => {
    return fn.toString().indexOf("=>") < 0 && !("prototype" in fn);
};
export const clone = <T>(source: T, isDeep = false) => {
    const res: T = {} as any;
    for (const prop in source) {
        let val = source[prop];
        if (isDeep && val && val.constructor === Object)
            val = clone(val, isDeep);
        res[prop] = val;
    }
    return res;
};
// export const toTimezone = (date: Date, targetTimezoneOffset: number, sourceTimezoneOffset?: number) => {
//     sourceTimezoneOffset = sourceTimezoneOffset !== undefined ? sourceTimezoneOffset : date.getTimezoneOffset();
//     date = date.
// }
export const fillZero = (value: number, factor = 2): string => {
    const isNegative = value < 0;
    if (isNegative) value = Math.abs(value);
    return (isNegative ? "-" : "") + (("0").repeat(factor - 1) + value).slice(-factor);
};
/**
 * 
 * @param str source: http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 */
export const hashCode = (str: string, hash: number = 0) => {
    if (!str || str.length === 0)
        return hash;
    const l = str.length;
    for (let i = 0; i < l; i++) {
        const charCode = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + charCode;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};