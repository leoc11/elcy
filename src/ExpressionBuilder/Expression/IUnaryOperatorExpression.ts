import { IExpression } from "./IExpression";

export interface IUnaryOperatorExpression extends IExpression {
    operand: IExpression;
}
