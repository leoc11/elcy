import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
import { ValueExpression } from "./ValueExpression";
export class NotExpression extends ExpressionBase<boolean> implements IUnaryOperatorExpression {
    public static Create(operand: IExpression<boolean>) {
        const result = new NotExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.Create<boolean>(result);

        return result;
    }
    constructor(public operand: IExpression) {
        super(Boolean);
    }

    public toString(transformer: ExpressionTransformer): string {
        return "!" + this.operand.toString(transformer);
    }
    public execute(transformer: ExpressionTransformer) {
        return !this.operand.execute(transformer);
    }
}
