import { IExpression } from "./IExpression";

export interface IMemberOperatorExpression<TE = unknown, T = unknown> extends IExpression<T> {
    objectOperand: IExpression<TE>;
    clone(replaceMap?: Map<IExpression, IExpression>): IMemberOperatorExpression<TE, T>;
}
