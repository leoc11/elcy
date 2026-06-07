import { PrimitiveType } from "src/Common/Type";
import { resolveClone } from "../../Helper/Expression";
import { hashCode, hashCodeAdd } from "../../Helper/Hash";
import { IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
export class TypeofExpression implements IUnaryOperatorExpression<string> {
    constructor(public operand: IExpression) { }
    public type: PrimitiveType<string> = String;
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
