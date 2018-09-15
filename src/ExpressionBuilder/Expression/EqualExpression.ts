import { ExpressionTransformer } from "../ExpressionTransformer";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class EqualExpression extends ExpressionBase<boolean> implements IBinaryOperatorExpression {
    public static create(leftOperand: IExpression, rightOperand: IExpression) {
        const result = new EqualExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.create<boolean>(result);

        return result;
    }
    constructor(public leftOperand: IExpression, public rightOperand: IExpression) {
        super(Boolean);
    }

    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return "(" + this.leftOperand.toString() + " == " + this.rightOperand.toString() + ")";
    }
    public execute(transformer?: ExpressionTransformer) {
        // tslint:disable-next-line:triple-equals
        return this.leftOperand.execute(transformer) == this.rightOperand.execute(transformer);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const left = replaceMap.has(this.leftOperand) ? replaceMap.get(this.leftOperand) : this.leftOperand.clone(replaceMap);
        const right = replaceMap.has(this.rightOperand) ? replaceMap.get(this.rightOperand) : this.rightOperand.clone(replaceMap);
        return new EqualExpression(left, right);
    }
}
