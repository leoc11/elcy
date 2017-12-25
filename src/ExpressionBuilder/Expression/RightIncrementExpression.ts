import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class RightIncrementExpression extends ExpressionBase<number> {
    public static Create(operand: IExpression<number>) {
        const result = new RightIncrementExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.Create<number>(result);

        return result;
    }
    constructor(public readonly Operand: IExpression) {
        super(Number);
    }

    public ToString(): string {
        return this.Operand.ToString() + "++";
    }
    // TODO: return before increment;
    public Execute() {
        return this.Operand.Execute();
    }
}
