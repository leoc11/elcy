import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
import { ValueExpression } from "./ValueExpression";
import { resolveClone } from "../../Helper/Util";
export class NegationExpression extends ExpressionBase<number> implements IUnaryOperatorExpression {
    public static create(operand: IExpression<number>) {
        const result = new NegationExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.create<number>(result);

        return result;
    }
    constructor(public operand: IExpression<number>) {
        super(Number);
    }
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return "-" + this.operand.toString();
    }
    public execute(transformer: ExpressionTransformer) {
        return -this.operand.execute(transformer);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const operand = resolveClone(this.operand, replaceMap);
        const clone = new NegationExpression(operand);
        replaceMap.set(this, clone);
        return clone;
    }
}
