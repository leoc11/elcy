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

    public ToString(): string {
        return this.Operand.ToString() + "--";
    }
    public Execute() {
        return this.Operand.Execute();
    }
}
