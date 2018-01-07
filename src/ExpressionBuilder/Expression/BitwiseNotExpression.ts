import { ExpressionTransformer } from "../ExpressionTransformer";
import { BitwiseExpression } from "./BitwiseExpression";
import { IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
import { ValueExpression } from "./ValueExpression";
export class BitwiseNotExpression extends BitwiseExpression implements IUnaryOperatorExpression {
    public static Create(operand: IExpression) {
        const result = new BitwiseNotExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.Create<number>(result);

        return result;
    }
    public operand: IExpression<number>;
    constructor(operand: IExpression) {
        super();
        this.operand = this.convertOperand(operand);
    }

    public toString(transformer: ExpressionTransformer): string {
        return "~" + this.operand.toString(transformer);
    }
    public execute(transformer: ExpressionTransformer) {
        // tslint:disable-next-line:no-bitwise
        return ~this.operand.execute(transformer);
    }
}
