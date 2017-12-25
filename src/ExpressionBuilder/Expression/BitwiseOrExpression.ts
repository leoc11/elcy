import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class BitwiseOrExpression extends ExpressionBase<number> {
    public static Create(leftOperand: IExpression, rightOperand: IExpression) {
        const result = new BitwiseOrExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.Create<number>(result);

        return result;
    }
    constructor(protected LeftOperand: IExpression, protected RightOperand: IExpression) {
        super(Number);
    }

    public ToString(): string {
        return "(" + this.LeftOperand.ToString() + " | " + this.RightOperand.ToString() + ")";
    }
    public Execute() {
        // tslint:disable-next-line:no-bitwise
        return this.LeftOperand.Execute() | this.RightOperand.Execute();
    }
}
