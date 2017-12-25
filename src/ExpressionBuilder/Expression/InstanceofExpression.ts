import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class InstanceofExpression extends ExpressionBase<boolean> {
    public static Create<TType>(leftOperand: IExpression, rightOperand: IExpression<{ new: TType }>) {
        const result = new InstanceofExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.Create<boolean>(result);

        return result;
    }
    constructor(protected LeftOperand: IExpression, protected RightOperand: IExpression) {
        super();
    }

    public ToString(): string {
        return "(" + this.LeftOperand.ToString() + " instanceof " + this.RightOperand.ToString() + ")";
    }
    public Execute() {
        return this.LeftOperand.Execute() instanceof this.RightOperand.Execute();
    }
}
