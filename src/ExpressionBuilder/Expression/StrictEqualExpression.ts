import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class StrictEqualExpression<TType> extends ExpressionBase<boolean> {
    public static Create<TType>(leftOperand: IExpression<TType>, rightOperand: IExpression<TType>) {
        const result = new StrictEqualExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.Create<boolean>(result);

        return result;
    }
    constructor(public LeftOperand: IExpression<TType>, public RightOperand: IExpression<TType>) {
        super(Boolean);
    }

    public toString(transformer: ExpressionTransformer): string {
        return "(" + this.LeftOperand.toString(transformer) + " === " + this.RightOperand.toString(transformer) + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        // tslint:disable-next-line:triple-equals
        return this.LeftOperand.execute(transformer) === this.RightOperand.execute(transformer);
    }
}
