import { IExpression } from "./IExpression";

export interface IMemberOperatorExpression<T> extends IExpression {
    objectOperand: IExpression<T>;
    clone(): IMemberOperatorExpression<T>;
}
