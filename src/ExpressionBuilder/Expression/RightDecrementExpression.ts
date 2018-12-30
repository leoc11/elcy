import { ExpressionTransformer } from "../ExpressionTransformer";
import { IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
import { ValueExpression } from "./ValueExpression";
import { resolveClone, hashCode } from "../../Helper/Util";
import { ParameterExpression } from "./ParameterExpression";
export class RightDecrementExpression implements IUnaryOperatorExpression<number> {
    public static create(operand: ParameterExpression<number>) {
        const result = new RightDecrementExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.create<number>(result);

        return result;
    }
    public type = Number;
    constructor(public readonly operand: ParameterExpression<number>) { }
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return this.operand.toString() + "--";
    }
    public execute(transformer: ExpressionTransformer) {
        return this.operand.execute(transformer);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const operand = resolveClone(this.operand, replaceMap);
        const clone = new RightDecrementExpression(operand);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCode("--", this.operand.hashCode());
    }
}
