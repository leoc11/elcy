import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class EqualExpression extends ExpressionBase<boolean> {
    public static Create(leftOperand: IExpression, rightOperand: IExpression) {
        const result = new EqualExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.Create<boolean>(result);

        return result;
    }
    constructor(protected LeftOperand: IExpression, protected RightOperand: IExpression) {
        super(Boolean);
    }

    public ToString(): string {
        return "(" + this.LeftOperand.ToString() + " == " + this.RightOperand.ToString() + ")";
    }
    public Execute() {
        // tslint:disable-next-line:triple-equals
        return this.LeftOperand.Execute() == this.RightOperand.Execute();
    }
}
