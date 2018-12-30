import { FunctionCallExpression } from "./FunctionCallExpression";
import { ExpressionBase, IExpression } from "./IExpression";
import { MethodCallExpression } from "./MethodCallExpression";
export abstract class BitwiseExpression extends ExpressionBase<number> {
    constructor() {
        super(Number);
    }
    protected convertOperand(operand: IExpression): IExpression<number> {
        if (operand.type === String) {
            operand = FunctionCallExpression.create(parseInt, [operand], "parseInt");
        }
        else if (operand.type !== Number) {
            operand = FunctionCallExpression.create(parseInt, [new MethodCallExpression(operand, "toString", [])], "parseInt");
        }
        return operand as any;
    }
    public abstract clone(replaceMap?: Map<IExpression, IExpression>): BitwiseExpression;
}
