import { ExpressionTransformer } from "../ExpressionTransformer";
import { BitwiseExpression } from "./BitwiseExpression";
import { IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
import { ValueExpression } from "./ValueExpression";
import { resolveClone } from "../../Helper/Util";
export class BitwiseNotExpression extends BitwiseExpression implements IUnaryOperatorExpression {
    public static create(operand: IExpression) {
        const result = new BitwiseNotExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.create<number>(result);

        return result;
    }
    public operand: IExpression<number>;
    constructor(operand: IExpression) {
        super();
        this.operand = this.convertOperand(operand);
    }

    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return "~" + this.operand.toString();
    }
    public execute(transformer: ExpressionTransformer) {
        return ~this.operand.execute(transformer);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const operand = resolveClone(this.operand, replaceMap);
        const clone = new BitwiseNotExpression(operand);
        replaceMap.set(this, clone);
        return clone;
    }
}
