import { ExpressionTransformer } from "../ExpressionTransformer";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class GreaterEqualExpression<TType> extends ExpressionBase<boolean> implements IBinaryOperatorExpression {
    public static Create<TType>(leftOperand: IExpression<TType>, rightOperand: IExpression<TType>) {
        const result = new GreaterEqualExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.Create<boolean>(result);

        return result;
    }
    constructor(public leftOperand: IExpression<TType>, public rightOperand: IExpression<TType>) {
        super(Boolean);
    }

    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return "(" + this.leftOperand.toString() + " >= " + this.rightOperand.toString() + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        return this.leftOperand.execute(transformer) >= this.rightOperand.execute(transformer);
    }
    public clone() {
        return new GreaterEqualExpression(this.leftOperand, this.rightOperand);
    }
}
