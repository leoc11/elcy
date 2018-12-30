import { FunctionCallExpression } from "./FunctionCallExpression";
import { IExpression } from "./IExpression";
import { MethodCallExpression } from "./MethodCallExpression";
import { ExpressionTransformer } from "../ExpressionTransformer";
export abstract class BitwiseExpression implements IExpression<number> {
    public type = Number;
    constructor() { }
    protected convertOperand(operand: IExpression): IExpression<number> {
        if (operand.type === String) {
            operand = FunctionCallExpression.create(parseInt, [operand], "parseInt");
        }
        else if (operand.type !== Number) {
            operand = FunctionCallExpression.create(parseInt, [new MethodCallExpression(operand, "toString", [])], "parseInt");
        }
        return operand as any;
    }
    public abstract execute(transformer?: ExpressionTransformer): any;
    public abstract hashCode(): number;
    public abstract clone(replaceMap?: Map<IExpression, IExpression>): BitwiseExpression;
}
