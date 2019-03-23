import { IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
import { resolveClone, hashCode, hashCodeAdd } from "../../Helper/Util";
export class NegationExpression implements IUnaryOperatorExpression<number> {
    public type = Number;
    constructor(public operand: IExpression<number>) { }
    public toString(): string {
        return "-" + this.operand.toString();
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const operand = resolveClone(this.operand, replaceMap);
        const clone = new NegationExpression(operand);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("-"), this.operand.hashCode());
    }
}
