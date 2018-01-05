import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class SubtractionExpression extends ExpressionBase<number> {
    public static Create(leftOperand: IExpression<number>, rightOperand: IExpression<number>) {
        const result = new SubtractionExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.Create(result);

        return result;
    }
    constructor(public LeftOperand: IExpression, public RightOperand: IExpression) {
        super(Number);
    }

    public toString(): string {
        return "(" + this.LeftOperand.toString() + " - " + this.RightOperand.toString() + ")";
    }
    public execute() {
        return this.LeftOperand.execute() - this.RightOperand.execute();
    }
}
