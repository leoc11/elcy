import { ExpressionTransformer } from "../ExpressionTransformer";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class NotEqualExpression extends ExpressionBase<boolean> implements IBinaryOperatorExpression {
    public static Create(leftOperand: IExpression, rightOperand: IExpression) {
        const result = new NotEqualExpression(leftOperand, rightOperand);
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
        return "(" + this.leftOperand.toString() + " != " + this.rightOperand.toString() + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        // tslint:disable-next-line:triple-equals
        return this.leftOperand.execute(transformer) != this.rightOperand.execute(transformer);
    }
}
