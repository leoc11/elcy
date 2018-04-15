import { ExpressionTransformer } from "../ExpressionTransformer";
import { BitwiseExpression } from "./BitwiseExpression";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class BitwiseXorExpression extends BitwiseExpression implements IBinaryOperatorExpression {
    public static create(leftOperand: IExpression, rightOperand: IExpression) {
        const result = new BitwiseXorExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.create<number>(result);

        return result;
    }
    public leftOperand: IExpression<number>;
    public rightOperand: IExpression<number>;
    constructor(leftOperand: IExpression, rightOperand: IExpression) {
        super();
        this.leftOperand = this.convertOperand(leftOperand);
        this.rightOperand = this.convertOperand(rightOperand);
    }

    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return "(" + this.leftOperand.toString() + " ^ " + this.rightOperand.toString() + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        return this.leftOperand.execute(transformer) ^ this.rightOperand.execute(transformer);
    }
    public clone() {
        return new BitwiseXorExpression(this.leftOperand, this.rightOperand);
    }
}
