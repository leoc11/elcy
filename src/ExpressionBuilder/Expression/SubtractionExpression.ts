import { ExpressionTransformer } from "../ExpressionTransformer";
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

    public toString(transformer: ExpressionTransformer): string {
        return "(" + this.LeftOperand.toString(transformer) + " - " + this.RightOperand.toString(transformer) + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        return this.LeftOperand.execute(transformer) - this.RightOperand.execute(transformer);
    }
}
