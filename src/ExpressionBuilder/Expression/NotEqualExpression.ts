import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class NotEqualExpression implements ExpressionBase<boolean> {
    public static Create(leftOperand: IExpression, rightOperand: IExpression) {
        const result = new NotEqualExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.Create<boolean>(result);

        return result;
    }
    constructor(protected LeftOperand: IExpression, protected RightOperand: IExpression) {
    }

    public ToString(): string {
        return "(" + this.LeftOperand.ToString() + " != " + this.RightOperand.ToString() + ")";
    }
    public Execute() {
        // tslint:disable-next-line:triple-equals
        return this.LeftOperand.Execute() != this.RightOperand.Execute();
    }
}
