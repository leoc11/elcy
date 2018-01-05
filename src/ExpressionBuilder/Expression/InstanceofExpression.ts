import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class InstanceofExpression extends ExpressionBase<boolean> {
    public static Create<TType>(leftOperand: IExpression, rightOperand: IExpression<{ new: TType }>) {
        const result = new InstanceofExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.Create<boolean>(result);

        return result;
    }
    constructor(protected LeftOperand: IExpression, protected RightOperand: IExpression) {
        super(Boolean);
    }

    public toString(transformer: ExpressionTransformer): string {
        return "(" + this.LeftOperand.toString(transformer) + " instanceof " + this.RightOperand.toString(transformer) + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        return this.LeftOperand.execute(transformer) instanceof this.RightOperand.execute(transformer);
    }
}
