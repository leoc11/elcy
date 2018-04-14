import { ExpressionTransformer } from "../ExpressionTransformer";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class OrExpression extends ExpressionBase<boolean> implements IBinaryOperatorExpression {
    public static Create(leftOperand: IExpression<boolean>, rightOperand: IExpression<boolean>) {
        const result = new OrExpression(leftOperand, rightOperand);
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
        return "(" + this.leftOperand.toString() + " || " + this.rightOperand.toString() + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        return this.leftOperand.execute(transformer) || this.rightOperand.execute(transformer);
    }
    public clone() {
        return new OrExpression(this.leftOperand, this.rightOperand);
    }
}
