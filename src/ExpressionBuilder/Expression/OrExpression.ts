import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class OrExpression extends ExpressionBase<boolean> {
    public static Create(leftOperand: IExpression<boolean>, rightOperand: IExpression<boolean>) {
        const result = new OrExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.Create<boolean>(result);

        return result;
    }
    constructor(protected LeftOperand: IExpression, protected RightOperand: IExpression) {
        super(Boolean);
    }

    public toString(transformer: ExpressionTransformer): string {
        return "(" + this.LeftOperand.toString(transformer) + " || " + this.RightOperand.toString(transformer) + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        return this.LeftOperand.execute(transformer) || this.RightOperand.execute(transformer);
    }
}
