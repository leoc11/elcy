import { ExpressionTransformer } from "../ExpressionTransformer";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class InstanceofExpression extends ExpressionBase<boolean> implements IBinaryOperatorExpression {
    public static Create<TType>(leftOperand: IExpression, rightOperand: IExpression<{ new: TType }>) {
        const result = new InstanceofExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.Create<boolean>(result);

        return result;
    }
    constructor(public leftOperand: IExpression, public rightOperand: IExpression) {
        super(Boolean);
    }

    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return "(" + this.leftOperand.toString() + " instanceof " + this.rightOperand.toString() + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        return this.leftOperand.execute(transformer) instanceof this.rightOperand.execute(transformer);
    }
}
