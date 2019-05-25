import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { IExpression } from "./IExpression";
export class AndExpression implements IBinaryOperatorExpression<boolean> {
    constructor(public leftOperand: IExpression<boolean>, public rightOperand: IExpression<boolean>) { }
    public type = Boolean;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const left = resolveClone(this.leftOperand, replaceMap);
        const right = resolveClone(this.rightOperand, replaceMap);
        const clone = new AndExpression(left, right);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("&&", this.leftOperand.hashCode()), this.rightOperand.hashCode());
    }

    public toString(): string {
        return "(" + this.leftOperand.toString() + " && " + this.rightOperand.toString() + ")";
    }
}
