import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class NotEqualExpression extends ExpressionBase<boolean> {
    public static Create(leftOperand: IExpression, rightOperand: IExpression) {
        const result = new NotEqualExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.Create<boolean>(result);

        return result;
    }
    constructor(protected LeftOperand: IExpression, protected RightOperand: IExpression) {
        super(Boolean);
    }

    public toString(transformer: ExpressionTransformer): string {
        return "(" + this.LeftOperand.toString(transformer) + " != " + this.RightOperand.toString(transformer) + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        // tslint:disable-next-line:triple-equals
        return this.LeftOperand.execute(transformer) != this.RightOperand.execute(transformer);
    }
}
