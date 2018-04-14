import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class TernaryExpression<TType> extends ExpressionBase<TType> {
    public static Create<TType>(logicalOperand: IExpression<boolean>, trueResultOperand: IExpression<TType>, falseResultOperand: IExpression<TType>) {
        const result = new TernaryExpression(logicalOperand, trueResultOperand, falseResultOperand);
        if (logicalOperand instanceof ValueExpression && trueResultOperand instanceof ValueExpression && falseResultOperand instanceof ValueExpression)
            return ValueExpression.Create<TType>(result);

        return result;
    }
    constructor(public logicalOperand: IExpression<boolean>, public trueResultOperand: IExpression<TType>, public falseResultOperand: IExpression<TType>) {
        super(trueResultOperand.type);
    }

    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return "(" + this.logicalOperand.toString() + " ? " + this.trueResultOperand.toString() + " : " + this.falseResultOperand.toString() + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        return this.logicalOperand.execute(transformer) ? this.trueResultOperand.execute(transformer) : this.falseResultOperand.execute(transformer);
    }
    public clone() {
        return new TernaryExpression(this.logicalOperand, this.trueResultOperand, this.falseResultOperand);
    }
}
