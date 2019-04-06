import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { IExpression } from "./IExpression";
import { resolveClone, hashCode, hashCodeAdd } from "../../Helper/Util";
export class StrictEqualExpression<T = any> implements IBinaryOperatorExpression<boolean> {
    public type = Boolean;
    constructor(public leftOperand: IExpression<T>, public rightOperand: IExpression<T>) { }
    public toString(): string {
        return "(" + this.leftOperand.toString() + " === " + this.rightOperand.toString() + ")";
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const left = resolveClone(this.leftOperand, replaceMap);
        const right = resolveClone(this.rightOperand, replaceMap);
        const clone = new StrictEqualExpression(left, right);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("===", this.leftOperand.hashCode()), this.rightOperand.hashCode());
    }
}
