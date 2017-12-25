import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class LessEqualExpression<TType> extends ExpressionBase<boolean> {
    public static Create<TType>(leftOperand: IExpression<TType>, rightOperand: IExpression<TType>) {
        const result = new LessEqualExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.Create<boolean>(result);

        return result;
    }
    constructor(protected LeftOperand: IExpression<TType>, protected RightOperand: IExpression<TType>) {
        super(Boolean);
    }

    public ToString(): string {
        return "(" + this.LeftOperand.ToString() + " <= " + this.RightOperand.ToString() + ")";
    }
    public Execute() {
        // tslint:disable-next-line:triple-equals
        return this.LeftOperand.Execute() <= this.RightOperand.Execute();
    }
}
