import { ExpressionTransformer } from "../ExpressionTransformer";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class BitwiseAndExpression extends ExpressionBase<number> implements IBinaryOperatorExpression {
    public static Create(leftOperand: IExpression, rightOperand: IExpression) {
        const result = new BitwiseAndExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.Create<number>(result);

        return result;
    }
    constructor(public leftOperand: IExpression, public rightOperand: IExpression) {
        super(Number);
    }

    public toString(transformer: ExpressionTransformer): string {
        return "(" + this.leftOperand.toString(transformer) + " & " + this.rightOperand.toString(transformer) + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        // tslint:disable-next-line:no-bitwise
        return this.leftOperand.execute(transformer) & this.rightOperand.execute(transformer);
    }
}
