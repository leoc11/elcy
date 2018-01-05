import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class NotExpression extends ExpressionBase<boolean> {
    public static Create(operand: IExpression<boolean>) {
        const result = new NotExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.Create<boolean>(result);

        return result;
    }
    constructor(protected Operand: IExpression) {
        super(Boolean);
    }

    public toString(transformer: ExpressionTransformer): string {
        return "!" + this.Operand.toString(transformer);
    }
    public execute(transformer: ExpressionTransformer) {
        return !this.Operand.execute(transformer);
    }
}
