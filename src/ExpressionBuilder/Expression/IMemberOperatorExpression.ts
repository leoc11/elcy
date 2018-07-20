import { IExpression } from "./IExpression";

export interface IMemberOperatorExpression<TE = any, T = any> extends IExpression<T> {
    objectOperand: IExpression<TE>;
    clone(): IMemberOperatorExpression<TE, T>;
}
