import { IExpression } from "./IExpression";

export interface IBinaryOperatorExpression extends IExpression {
    leftOperand: IExpression;
    rightOperand: IExpression;
    clone(replaceMap?: Map<IExpression, IExpression>): IBinaryOperatorExpression;
}
