import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
import { NotEqualExpression } from "./NotEqualExpression";
import { OrExpression } from "./OrExpression";
import { ValueExpression } from "./ValueExpression";
export class NotExpression extends ExpressionBase<boolean> implements IUnaryOperatorExpression {
    public static Create(operand: IExpression<boolean>) {
        const result = new NotExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.Create<boolean>(result);

        return result;
    }
    public operand: IExpression<boolean>;
    constructor(operand: IExpression) {
        super(Boolean);
        this.operand = this.convertOperand(operand);
    }
    public convertOperand(operand: IExpression): IExpression<boolean> {
        if (operand.type === Number) {
            operand = new OrExpression(new NotEqualExpression(operand, new ValueExpression(0)), new NotEqualExpression(operand, new ValueExpression(null)));
        }
        else if (operand.type === String) {
            operand = new OrExpression(new NotEqualExpression(operand, new ValueExpression("")), new NotEqualExpression(operand, new ValueExpression(null)));
        }
        else {
            operand = new NotEqualExpression(operand, new ValueExpression(null));
        }
        return operand as any;
    }
    public toString(transformer: ExpressionTransformer): string {
        return "!" + this.operand.toString(transformer);
    }
    public execute(transformer: ExpressionTransformer) {
        return !this.operand.execute(transformer);
    }
}
