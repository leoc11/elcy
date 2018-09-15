import { IExpression } from "./IExpression";

export interface IMemberOperatorExpression<TE = any, T = any> extends IExpression<T> {
    objectOperand: IExpression<TE>;
    clone(replaceMap?: Map<IExpression, IExpression>): IMemberOperatorExpression<TE, T>;
}
