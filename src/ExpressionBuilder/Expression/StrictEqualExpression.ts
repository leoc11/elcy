import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class StrictEqualExpression<TType> extends ExpressionBase<boolean> {
    public static Create<TType>(leftOperand: IExpression<TType>, rightOperand: IExpression<TType>) {
        const result = new StrictEqualExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.Create<boolean>(result);

        return result;
    }
    constructor(public LeftOperand: IExpression<TType>, public RightOperand: IExpression<TType>) {
        super(Boolean);
    }

    public toString(): string {
        return "(" + this.LeftOperand.toString() + " === " + this.RightOperand.toString() + ")";
    }
    public execute() {
        // tslint:disable-next-line:triple-equals
        return this.LeftOperand.execute() === this.RightOperand.execute();
    }
}
