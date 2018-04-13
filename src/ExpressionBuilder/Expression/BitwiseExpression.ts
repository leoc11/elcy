import { FunctionCallExpression } from "./FunctionCallExpression";
import { ExpressionBase, IExpression } from "./IExpression";
import { MethodCallExpression } from "./MethodCallExpression";
export abstract class BitwiseExpression extends ExpressionBase<number> {
    constructor() {
        super(Number);
    }
    protected convertOperand(operand: IExpression): IExpression<number> {
        if (operand.type === String) {
            operand = new FunctionCallExpression(parseInt, "parseInt", [operand]);
        }
        else if (operand.type !== Number) {
            operand = new FunctionCallExpression(parseInt, "parseInt", [new MethodCallExpression(operand, "toString", [])]);
        }
        return operand as any;
    }
    public abstract clone(): BitwiseExpression;
}
