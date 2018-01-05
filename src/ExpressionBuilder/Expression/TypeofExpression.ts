import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class TypeofExpression extends ExpressionBase<string> {
    public static Create(operand: IExpression) {
        const result = new TypeofExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.Create<string>(result);

        return result;
    }
    constructor(public Operand: IExpression) {
        super(String);
    }

    public toString(transformer: ExpressionTransformer): string {
        return "typeof " + this.Operand.toString(transformer);
    }
    public execute(transformer: ExpressionTransformer) {
        return typeof this.Operand.execute(transformer);
    }
}
