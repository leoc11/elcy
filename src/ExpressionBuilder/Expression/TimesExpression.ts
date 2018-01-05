import { ExpressionTransformer } from "../ExpressionTransformer";
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

    public toString(transformer: ExpressionTransformer): string {
        return "(" + this.LeftOperand.toString(transformer) + " * " + this.RightOperand.toString(transformer) + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        return this.LeftOperand.execute(transformer) * this.RightOperand.execute(transformer);
    }
}
