import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { IExpression } from "./IExpression";
export class InstanceofExpression implements IBinaryOperatorExpression<boolean> {
    public type = Boolean;
    constructor(public leftOperand: IExpression, public rightOperand: IExpression) { }
    public toString(): string {
        return "(" + this.leftOperand.toString() + " instanceof " + this.rightOperand.toString() + ")";
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) { replaceMap = new Map(); }
        const left = resolveClone(this.leftOperand, replaceMap);
        const right = resolveClone(this.rightOperand, replaceMap);
        const clone = new InstanceofExpression(left, right);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("instanceof", this.leftOperand.hashCode()), this.rightOperand.hashCode());
    }
}
