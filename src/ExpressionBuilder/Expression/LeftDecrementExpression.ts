import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class LeftDecrementExpression extends ExpressionBase<number> {
    public static Create(operand: IExpression<number>) {
        const result = new LeftDecrementExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.Create<number>(result);

        return result;
    }
    constructor(protected Operand: IExpression) {
        super(Number);
    }

    public toString(transformer: ExpressionTransformer): string {
        return "--" + this.Operand.toString(transformer);
    }
    public execute(transformer: ExpressionTransformer) {
        return this.Operand.execute(transformer) - 1;
    }
}
