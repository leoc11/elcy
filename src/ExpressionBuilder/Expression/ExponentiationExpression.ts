import { ExpressionTransformer } from "../ExpressionTransformer";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { ExpressionBase } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class ExponentiationExpression extends ExpressionBase<number> implements IBinaryOperatorExpression {
    public static create(leftOperand: ExpressionBase<number>, rightOperand: ExpressionBase<number>) {
        const result = new ExponentiationExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.create<number>(result);

        return result;
    }
    constructor(public leftOperand: ExpressionBase<number>, public rightOperand: ExpressionBase<number>) {
        super(Number);
    }

    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return "(" + this.leftOperand.toString() + " ** " + this.rightOperand.toString() + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        return this.leftOperand.execute(transformer) ** this.rightOperand.execute(transformer);
    }
    public clone() {
        return new ExponentiationExpression(this.leftOperand, this.rightOperand);
    }
}
