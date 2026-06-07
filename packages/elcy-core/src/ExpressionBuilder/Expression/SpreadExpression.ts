import { resolveClone } from "../../Helper/Expression";
import { hashCode, hashCodeAdd } from "../../Helper/Hash";
import { IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
import { ParameterExpression } from "./ParameterExpression";
export class SpreadExpression<T = unknown> implements IUnaryOperatorExpression<T[]> {
    constructor(public readonly operand: ParameterExpression<T[]>) { }
    public type = Array;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const operand = resolveClone(this.operand, replaceMap);
        const clone = new SpreadExpression(operand);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("..."), this.operand.hashCode());
    }
    public toString(): string {
        return "..." + this.operand.toString();
    }
}
