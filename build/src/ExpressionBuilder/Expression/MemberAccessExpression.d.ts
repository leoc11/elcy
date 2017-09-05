import { IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export declare class MemberAccessExpression implements IExpression {
    protected LeftOperand: IExpression;
    protected RightOperand: IExpression;
    static Create(leftOperand: IExpression, rightOperand: IExpression): ValueExpression<any> | MemberAccessExpression;
    constructor(LeftOperand: IExpression, RightOperand: IExpression);
    ToString(): string;
    Execute(): any;
}
