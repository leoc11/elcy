import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class LeftIncrementExpression extends ExpressionBase<number> {
    public static Create(operand: IExpression<number>) {
        const result = new LeftIncrementExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.Create<number>(result);

        return result;
    }
    constructor(protected Operand: IExpression) {
        super();
    }

    public ToString(): string {
        return "++" + this.Operand.ToString();
    }
    public Execute() {
        return this.Operand.Execute() + 1;
    }
}
