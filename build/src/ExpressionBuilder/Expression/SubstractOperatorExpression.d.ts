import { IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export declare class SubstractOperatorExpression implements IExpression {
    protected LeftOperand: IExpression;
    protected RightOperand: IExpression;
    static Create(leftOperand: IExpression, rightOperand: IExpression): ValueExpression<any> | SubstractOperatorExpression;
    constructor(LeftOperand: IExpression, RightOperand: IExpression);
    ToString(): string;
    Execute(): number | undefined;
}
