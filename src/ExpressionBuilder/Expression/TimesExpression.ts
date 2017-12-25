import { ExpressionBase } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class TimesExpression extends ExpressionBase<number> {
    public static Create(leftOperand: ExpressionBase<number>, rightOperand: ExpressionBase<number>) {
        const result = new TimesExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.Create<number>(result);

        return result;
    }
    constructor(public LeftOperand: ExpressionBase<number>, protected RightOperand: ExpressionBase<number>) {
        super(Number);
    }

    public ToString(): string {
        return "(" + this.LeftOperand.ToString() + " * " + this.RightOperand.ToString() + ")";
    }
    public Execute() {
        return this.LeftOperand.Execute() * this.RightOperand.Execute();
    }
}
