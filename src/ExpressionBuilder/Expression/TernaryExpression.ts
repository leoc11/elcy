import { ExpressionTransformer } from "../ExpressionTransformer";
import { IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
import { GenericType, NullConstructor } from "../../Common/Type";
import { resolveClone, hashCode, hashCodeAdd } from "../../Helper/Util";
export class TernaryExpression<T1 = any, T2 = any> implements IExpression<T1 | T2> {
    public static create<T>(logicalOperand: IExpression<boolean>, trueResultOperand: IExpression<T>, falseResultOperand: IExpression<T>) {
        const result = new TernaryExpression(logicalOperand, trueResultOperand, falseResultOperand);
        if (logicalOperand instanceof ValueExpression && trueResultOperand instanceof ValueExpression && falseResultOperand instanceof ValueExpression)
            return ValueExpression.create<T>(result);

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

    constructor(public logicalOperand: IExpression<boolean>, public trueResultOperand: IExpression<T1>, public falseResultOperand: IExpression<T2>) { }
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
    public hashCode() {
        return hashCodeAdd(hashCodeAdd(hashCode(":", hashCode("?", this.logicalOperand.hashCode())), this.trueResultOperand.hashCode()), this.falseResultOperand.hashCode());
    }
}
