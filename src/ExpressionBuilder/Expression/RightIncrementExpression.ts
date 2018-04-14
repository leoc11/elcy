import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
import { ValueExpression } from "./ValueExpression";
export class RightIncrementExpression extends ExpressionBase<number> implements IUnaryOperatorExpression {
    public static Create(operand: IExpression<number>) {
        const result = new RightIncrementExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.Create<number>(result);

        return result;
    }
    constructor(public readonly operand: IExpression) {
        super(Number);
    }

    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return this.operand.toString() + "++";
    }
    // TODO: return before increment;
    public execute(transformer: ExpressionTransformer) {
        return this.operand.execute(transformer);
    }
    public clone() {
        return new RightIncrementExpression(this.operand);
    }
}
