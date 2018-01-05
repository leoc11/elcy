import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class RightDecrementExpression extends ExpressionBase<number> {
    public static Create(operand: IExpression<number>) {
        const result = new RightDecrementExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.Create<number>(result);

        return result;
    }
    constructor(public readonly Operand: IExpression) {
        super(Number);
    }

    public toString(): string {
        return this.Operand.toString() + "--";
    }
    public execute() {
        return this.Operand.execute();
    }
}
