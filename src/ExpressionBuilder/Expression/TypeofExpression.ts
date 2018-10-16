import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
import { ValueExpression } from "./ValueExpression";
import { resolveClone, hashCode, hashCodeAdd } from "../../Helper/Util";
export class TypeofExpression extends ExpressionBase<string> implements IUnaryOperatorExpression {
    public static create(operand: IExpression) {
        const result = new TypeofExpression(operand);
        if (operand instanceof ValueExpression)
            return ValueExpression.create<string>(result);

        return result;
    }
    constructor(public operand: IExpression) {
        super(String);
    }

    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return "typeof " + this.operand.toString();
    }
    public execute(transformer: ExpressionTransformer) {
        return typeof this.operand.execute(transformer);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const operand = resolveClone(this.operand, replaceMap);
        const clone = new TypeofExpression(operand);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("typeof"), this.operand.hashCode());
    }
}
