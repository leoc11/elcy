import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
import { GenericType, NullConstructor } from "../../Common/Type";
import { resolveClone } from "../../Helper/Util";
export class TernaryExpression<T1 = any, T2 = any> extends ExpressionBase<T1 | T2> {
    public static create<TType>(logicalOperand: IExpression<boolean>, trueResultOperand: IExpression<TType>, falseResultOperand: IExpression<TType>) {
        const result = new TernaryExpression(logicalOperand, trueResultOperand, falseResultOperand);
        if (logicalOperand instanceof ValueExpression && trueResultOperand instanceof ValueExpression && falseResultOperand instanceof ValueExpression)
            return ValueExpression.create<TType>(result);

        return result;
    }
    public get type(): GenericType<T1 | T2> {
        if (this.trueResultOperand.type as any === this.falseResultOperand.type) {
            return this.trueResultOperand.type;
        }
        else if (this.trueResultOperand.type === NullConstructor) {
            return this.falseResultOperand.type;
        }
        else if (this.falseResultOperand.type === NullConstructor) {
            return this.trueResultOperand.type;
        }

        return Object;
    }

    constructor(public logicalOperand: IExpression<boolean>, public trueResultOperand: IExpression<T1>, public falseResultOperand: IExpression<T2>) {
        super();
    }

    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        return "(" + this.logicalOperand.toString() + " ? " + this.trueResultOperand.toString() + " : " + this.falseResultOperand.toString() + ")";
    }
    public execute(transformer?: ExpressionTransformer) {
        return this.logicalOperand.execute(transformer) ? this.trueResultOperand.execute(transformer) : this.falseResultOperand.execute(transformer);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const logicalOperand = resolveClone(this.logicalOperand, replaceMap);
        const trueResultOperand = resolveClone(this.trueResultOperand, replaceMap);
        const falseResultOperand = resolveClone(this.falseResultOperand, replaceMap);
        const clone = new TernaryExpression(logicalOperand, trueResultOperand, falseResultOperand);
        replaceMap.set(this, clone);
        return clone;
    }
}
