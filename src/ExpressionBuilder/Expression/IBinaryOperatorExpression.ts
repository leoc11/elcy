import { IExpression } from "./IExpression";

export interface IBinaryOperatorExpression {
    leftOperand: IExpression;
    rightOperand: IExpression;
}
