import { IExpression } from "./IExpression";

export interface IUnaryOperatorExpression<T = any> extends IExpression<T> {
    operand: IExpression;
    clone(): IUnaryOperatorExpression<T>;
}
