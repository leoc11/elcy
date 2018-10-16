import { IExpression } from "./IExpression";

export interface IBinaryOperatorExpression<T = any> extends IExpression<T> {
    leftOperand: IExpression;
    rightOperand: IExpression;
    clone(replaceMap?: Map<IExpression, IExpression>): IBinaryOperatorExpression<T>;
}
