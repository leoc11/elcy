import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class GreaterEqualExpression<TType> extends ExpressionBase<boolean> {
    public static Create<TType>(leftOperand: IExpression<TType>, rightOperand: IExpression<TType>) {
        const result = new GreaterEqualExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.Create<boolean>(result);

        return result;
    }
    constructor(protected LeftOperand: IExpression<TType>, protected RightOperand: IExpression<TType>) {
        super(Boolean);
    }

    public toString(): string {
        return "(" + this.LeftOperand.toString() + " >= " + this.RightOperand.toString() + ")";
    }
    public execute() {
        // tslint:disable-next-line:triple-equals
        return this.LeftOperand.execute() >= this.RightOperand.execute();
    }
}
