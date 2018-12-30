import { ExpressionTransformer } from "../ExpressionTransformer";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
import { resolveClone } from "../../Helper/Util";
export class MultiplicationExpression extends ExpressionBase<number> implements IBinaryOperatorExpression {
    public static create(leftOperand: IExpression<number>, rightOperand: IExpression<number>) {
        const result = new MultiplicationExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.create<number>(result);

        return result;
    }
    constructor(public leftOperand: IExpression<number>, public rightOperand: IExpression<number>) {
        super(Number);
    }

    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return "(" + this.leftOperand.toString() + " * " + this.rightOperand.toString() + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        return this.leftOperand.execute(transformer) * this.rightOperand.execute(transformer);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const left = resolveClone(this.leftOperand, replaceMap);
        const right = resolveClone(this.rightOperand, replaceMap);
        const clone = new MultiplicationExpression(left, right);
        replaceMap.set(this, clone);
        return clone;
    }
}
