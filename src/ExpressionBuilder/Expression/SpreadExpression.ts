import { IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
import { resolveClone, hashCode, hashCodeAdd } from "../../Helper/Util";
import { ParameterExpression } from "./ParameterExpression";
export class SpreadExpression<T = any> implements IUnaryOperatorExpression<Array<T>> {
    public type = Array;
    constructor(public readonly operand: ParameterExpression<Array<T>>) { }
    public toString(): string {
        return "..." + this.operand.toString();
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const operand = resolveClone(this.operand, replaceMap);
        const clone = new SpreadExpression(operand);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("..."), this.operand.hashCode());
    }
}