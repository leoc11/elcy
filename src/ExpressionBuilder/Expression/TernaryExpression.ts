import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class TernaryExpression<TType> extends ExpressionBase<TType> {
    public static Create<TType>(logicalOperand: IExpression<boolean>, trueResultOperand: IExpression<TType>, falseResultOperand: IExpression<TType>) {
        const result = new TernaryExpression(logicalOperand, trueResultOperand, falseResultOperand);
        if (logicalOperand instanceof ValueExpression && trueResultOperand instanceof ValueExpression && falseResultOperand instanceof ValueExpression)
            return ValueExpression.Create<TType>(result);

        return result;
    }
    constructor(public LogicalOperand: IExpression<boolean>, public TrueResultOperand: IExpression<TType>, public FalseResultOperand: IExpression<TType>) {
        super(); // TODO: resolve constructor.
    }

    public toString(): string {
        return "(" + this.LogicalOperand.toString() + " ? " + this.TrueResultOperand.toString() + " : " + this.FalseResultOperand.toString() + ")";
    }
    public execute() {
        return this.LogicalOperand.execute() ? this.TrueResultOperand.execute() : this.FalseResultOperand.execute();
    }
}
