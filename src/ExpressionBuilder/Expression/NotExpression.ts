import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class NotExpression implements ExpressionBase<boolean> {
    public static Create(operand: IExpression<boolean>) {
        const result = new NotExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.Create<boolean>(result);

        return result;
    }
    constructor(protected Operand: IExpression) {
    }

    public ToString(): string {
        return "!" + this.Operand.ToString();
    }
    public Execute() {
        return !this.Operand.Execute();
    }
}
