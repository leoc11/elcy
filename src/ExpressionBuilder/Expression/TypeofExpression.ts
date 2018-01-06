import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
import { ValueExpression } from "./ValueExpression";
export class TypeofExpression extends ExpressionBase<string> implements IUnaryOperatorExpression {
    public static Create(operand: IExpression) {
        const result = new TypeofExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.Create<string>(result);

        return result;
    }
    constructor(public operand: IExpression) {
        super(String);
    }

    public toString(transformer: ExpressionTransformer): string {
        return "typeof " + this.operand.toString(transformer);
    }
    public execute(transformer: ExpressionTransformer) {
        return typeof this.operand.execute(transformer);
    }
}
