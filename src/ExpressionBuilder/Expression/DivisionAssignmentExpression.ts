import { ExpressionTransformer } from "../ExpressionTransformer";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { ExpressionBase, IExpression } from "./IExpression";
import { ParameterExpression } from "./ParameterExpression";
import { resolveClone } from "../../Helper/Util";
export class DivisionAssignmentExpression extends ExpressionBase<number> implements IBinaryOperatorExpression {
    public static create(leftOperand: ParameterExpression<number>, rightOperand: IExpression<number>) {
        return new DivisionAssignmentExpression(leftOperand, rightOperand);
    }
    constructor(public leftOperand: ParameterExpression<number>, public rightOperand: IExpression<number>) {
        super(rightOperand.type);
    }
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return "(" + this.leftOperand.toString() + " *= " + this.rightOperand.toString() + ")";
    }
    public execute(transformer: ExpressionTransformer) {
        const value = this.rightOperand.execute(transformer);
        transformer.scopeParameters.remove(this.leftOperand.name);
        transformer.scopeParameters.add(this.leftOperand.name, transformer.scopeParameters.get(this.leftOperand.name) * value);
        return value;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const left = resolveClone(this.leftOperand, replaceMap);
        const right = resolveClone(this.rightOperand, replaceMap);
        const clone = new DivisionAssignmentExpression(left, right);
        replaceMap.set(this, clone);
        return clone;
    }
}
