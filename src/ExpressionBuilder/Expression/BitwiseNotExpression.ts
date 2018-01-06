import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
import { ValueExpression } from "./ValueExpression";
export class BitwiseNotExpression extends ExpressionBase<number> implements IUnaryOperatorExpression {
    public static Create(operand: IExpression) {
        const result = new BitwiseNotExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.Create<number>(result);

        return result;
    }
    constructor(public operand: IExpression) {
        super(Number);
    }

    public toString(transformer: ExpressionTransformer): string {
        return "~" + this.operand.toString(transformer);
    }
    public execute(transformer: ExpressionTransformer) {
        // tslint:disable-next-line:no-bitwise
        return ~this.operand.execute(transformer);
    }
}
