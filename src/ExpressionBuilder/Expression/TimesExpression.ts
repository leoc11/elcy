import { IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class DivisionExpression implements IExpression {
    public static Create(leftOperand: IExpression, rightOperand: IExpression): ValueExpression<any> | DivisionExpression {
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return new ValueExpression(leftOperand.Execute() / rightOperand.Execute(), "(" + leftOperand.ToString() + " - " + rightOperand.ToString() + ")");
        else
            return new DivisionExpression(leftOperand, rightOperand);
    }
    constructor(protected LeftOperand: IExpression, protected RightOperand: IExpression) {
    }

    public ToString(): string {
        return "(" + this.LeftOperand.ToString + " * " + this.RightOperand.ToString() + ")";
    }
    public Execute() {
        return this.LeftOperand.Execute() * this.RightOperand.Execute();
    }
}
