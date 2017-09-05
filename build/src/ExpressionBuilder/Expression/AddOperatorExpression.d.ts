import { IExpression, ValueExpression } from "./IExpression";
export declare class AddOperatorExpression implements IExpression {
    protected LeftOperand: ValueExpression;
    protected RightOperand: ValueExpression;
    constructor(LeftOperand: ValueExpression, RightOperand: ValueExpression);
    ToString(): string;
    Execute(): any;
}
