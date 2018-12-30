import { ExpressionTransformer } from "../ExpressionTransformer";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
import { resolveClone, hashCode, hashCodeAdd } from "../../Helper/Util";
export class GreaterThanExpression implements IBinaryOperatorExpression<boolean> {
    public static create(leftOperand: IExpression, rightOperand: IExpression) {
        const result = new GreaterThanExpression(leftOperand, rightOperand);
        if (leftOperand instanceof ValueExpression && rightOperand instanceof ValueExpression)
            return ValueExpression.create<boolean>(result);

        return result;
    }
    public type = Boolean;
    constructor(public leftOperand: IExpression, public rightOperand: IExpression) { }
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return "(" + this.leftOperand.toString() + " > " + this.rightOperand.toString() + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        return this.leftOperand.execute(transformer) > this.rightOperand.execute(transformer);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const left = resolveClone(this.leftOperand, replaceMap);
        const right = resolveClone(this.rightOperand, replaceMap);
        const clone = new GreaterThanExpression(left, right);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode(">", this.leftOperand.hashCode()), this.rightOperand.hashCode());
    }
}
