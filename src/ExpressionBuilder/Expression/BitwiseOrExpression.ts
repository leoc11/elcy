import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class BitwiseOrExpression extends ExpressionBase<number> {
    public static Create(leftOperand: IExpression, rightOperand: IExpression) {
        const result = new BitwiseOrExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.Create<number>(result);

        return result;
    }
    constructor(protected LeftOperand: IExpression, protected RightOperand: IExpression) {
        super(Number);
    }

    public toString(transformer: ExpressionTransformer): string {
        return "(" + this.LeftOperand.toString(transformer) + " | " + this.RightOperand.toString(transformer) + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        // tslint:disable-next-line:no-bitwise
        return this.LeftOperand.execute(transformer) | this.RightOperand.execute(transformer);
    }
}
