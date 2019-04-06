import { FunctionCallExpression } from "./FunctionCallExpression";
import { IExpression } from "./IExpression";
import { MethodCallExpression } from "./MethodCallExpression";
import { ValueExpression } from "./ValueExpression";
export abstract class BitwiseExpression implements IExpression<number> {
    public type = Number;
    constructor() { }
    protected convertOperand(operand: IExpression): IExpression<number> {
        if (operand.type === String) {
            operand = new FunctionCallExpression(new ValueExpression(parseInt), [operand], "parseInt");
        }
        else if (operand.type !== Number) {
            operand = new FunctionCallExpression(new ValueExpression(parseInt), [new MethodCallExpression(operand, "toString", [], String)], "parseInt");
        }
        return operand as any;
    }
    public abstract hashCode(): number;
    public abstract clone(replaceMap?: Map<IExpression, IExpression>): BitwiseExpression;
}
