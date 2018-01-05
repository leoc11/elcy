import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class NotExpression extends ExpressionBase<boolean> {
    public static Create(operand: IExpression<boolean>) {
        const result = new NotExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.Create<boolean>(result);

        return result;
    }
    constructor(protected Operand: IExpression) {
        super(Boolean);
    }

    public toString(): string {
        return "!" + this.Operand.toString();
    }
    public execute() {
        return !this.Operand.execute();
    }
}
