import { IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class SubstractOperatorExpression implements IExpression {
    public static Create(leftOperand: IExpression, rightOperand: IExpression): ValueExpression<any> | SubstractOperatorExpression {
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return new ValueExpression(leftOperand.Execute() + rightOperand.Execute());
        else
            return new SubstractOperatorExpression(leftOperand, rightOperand);
    }
    constructor(protected LeftOperand: IExpression, protected RightOperand: IExpression) {
    }

    public ToString(): string {
        return "(" + this.LeftOperand.ToString + " - " + this.RightOperand.ToString() + ")";
    }
    public Execute() {
        if ()
            return this.LeftOperand.Execute() - this.RightOperand.Execute();
    }
}
