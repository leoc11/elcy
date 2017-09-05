import { IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export declare class FunctionCallExpression implements IExpression {
    protected LeftOperand: IExpression;
    protected RightOperand: IExpression;
    static Create(leftOperand: IExpression, rightOperand: IExpression): ValueExpression<any> | FunctionCallExpression;
    constructor(LeftOperand: IExpression, RightOperand: IExpression);
    ToString(): string;
    Execute(): number;
}
