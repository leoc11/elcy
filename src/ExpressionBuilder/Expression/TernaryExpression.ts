import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class TernaryExpression<TType> implements ExpressionBase<TType> {
    public static Create<TType>(logicalOperand: IExpression<boolean>, trueResultOperand: IExpression<TType>, falseResultOperand: IExpression<TType>) {
        const result = new TernaryExpression(logicalOperand, trueResultOperand, falseResultOperand);
        if (logicalOperand instanceof ValueExpression && trueResultOperand instanceof ValueExpression && falseResultOperand instanceof ValueExpression)
            return ValueExpression.Create<TType>(result);

        return result;
    }
    constructor(protected LogicalOperand: IExpression<boolean>, protected TrueResultOperand: IExpression<TType>, protected FalseResultOperand: IExpression<TType>) {
    }

    public ToString(): string {
        return "(" + this.LogicalOperand.ToString() + " ? " + this.TrueResultOperand.ToString() + " : " + this.FalseResultOperand.ToString() + ")";
    }
    public Execute() {
        return this.LogicalOperand.Execute() ? this.TrueResultOperand.Execute() : this.FalseResultOperand.Execute();
    }
}
