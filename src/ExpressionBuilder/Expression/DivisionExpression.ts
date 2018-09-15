import { ExpressionTransformer } from "../ExpressionTransformer";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class DivisionExpression extends ExpressionBase<number> implements IBinaryOperatorExpression {
    public static create(leftOperand: IExpression<number>, rightOperand: IExpression<number>) {
        const result = new DivisionExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.create<number>(result);

        return result;
    }
    constructor(public leftOperand: IExpression, public rightOperand: IExpression) {
        super(Number);
    }

    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return "(" + this.leftOperand.toString() + " / " + this.rightOperand.toString() + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        return this.leftOperand.execute(transformer) / this.rightOperand.execute(transformer);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const left = replaceMap.has(this.leftOperand) ? replaceMap.get(this.leftOperand) : this.leftOperand.clone(replaceMap);
        const right = replaceMap.has(this.rightOperand) ? replaceMap.get(this.rightOperand) : this.rightOperand.clone(replaceMap);
        return new DivisionExpression(left, right);
    }
}
