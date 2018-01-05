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
        super(Boolean);
    }

    public toString(): string {
        return "(" + this.LeftOperand.toString() + " instanceof " + this.RightOperand.toString() + ")";
    }
    public execute() {
        return this.LeftOperand.execute() instanceof this.RightOperand.execute();
    }
}
