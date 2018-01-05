import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class GreaterEqualExpression<TType> extends ExpressionBase<boolean> {
    public static Create<TType>(leftOperand: IExpression<TType>, rightOperand: IExpression<TType>) {
        const result = new GreaterEqualExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.Create<boolean>(result);

        return result;
    }
    constructor(protected LeftOperand: IExpression<TType>, protected RightOperand: IExpression<TType>) {
        super(Boolean);
    }

    public toString(transformer: ExpressionTransformer): string {
        return "(" + this.LeftOperand.toString(transformer) + " >= " + this.RightOperand.toString(transformer) + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        // tslint:disable-next-line:triple-equals
        return this.LeftOperand.execute(transformer) >= this.RightOperand.execute(transformer);
    }
}
