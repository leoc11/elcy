import { ExpressionTransformer } from "../ExpressionTransformer";
import { BitwiseExpression } from "./BitwiseExpression";
import { IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
import { ValueExpression } from "./ValueExpression";
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
        const operand = replaceMap.has(this.operand) ? replaceMap.get(this.operand) : this.operand.clone(replaceMap);
        return new BitwiseNotExpression(operand);
    }
}
