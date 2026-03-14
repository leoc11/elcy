import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
export class TypeofExpression implements IUnaryOperatorExpression<string> {
    constructor(public operand: IExpression) { }
    public type = String;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const operand = resolveClone(this.operand, replaceMap);
        const clone = new TypeofExpression(operand);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("typeof"), this.operand.hashCode());
    }
    public toString(): string {
        return "typeof " + this.operand.toString();
    }
}
