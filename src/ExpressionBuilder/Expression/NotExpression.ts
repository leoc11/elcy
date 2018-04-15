import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
import { NotEqualExpression } from "./NotEqualExpression";
import { OrExpression } from "./OrExpression";
import { ValueExpression } from "./ValueExpression";
export class NotExpression extends ExpressionBase<boolean> implements IUnaryOperatorExpression {
    public static create(operand: IExpression<boolean>) {
        const result = new NotExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.create<boolean>(result);

        return result;
    }
    public operand: IExpression<boolean>;
    constructor(operand: IExpression) {
        super(Boolean);
        this.operand = this.convertOperand(operand);
    }
    public convertOperand(operand: IExpression): IExpression<boolean> {
        switch (operand.type) {
            case Number:
                return new OrExpression(new NotEqualExpression(operand, new ValueExpression(0)), new NotEqualExpression(operand, new ValueExpression(null)));
            case String:
                return new OrExpression(new NotEqualExpression(operand, new ValueExpression("")), new NotEqualExpression(operand, new ValueExpression(null)));
            case Boolean:
                return operand;
            default:
                return new NotEqualExpression(operand, new ValueExpression(null));
        }
    }
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return "!" + this.operand.toString();
    }
    public execute(transformer: ExpressionTransformer) {
        return !this.operand.execute(transformer);
    }
    public clone() {
        return new NotExpression(this.operand);
    }
}
