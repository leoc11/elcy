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

    public toString(): string {
        return "(" + this.LeftOperand.toString() + " * " + this.RightOperand.toString() + ")";
    }
    public execute() {
        return this.LeftOperand.execute() * this.RightOperand.execute();
    }
}
