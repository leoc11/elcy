import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
import { ValueExpression } from "./ValueExpression";
import { resolveClone } from "../../Helper/Util";
export class RightDecrementExpression extends ExpressionBase<number> implements IUnaryOperatorExpression {
    public static create(operand: IExpression<number>) {
        const result = new RightDecrementExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.create<number>(result);

        return result;
    }
    constructor(public readonly operand: IExpression) {
        super(Number);
    }

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
}
