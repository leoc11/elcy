import { hashCode, resolveClone } from "../../Helper/Util";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { IExpression } from "./IExpression";
export class EqualExpression implements IBinaryOperatorExpression<boolean> {
    constructor(public leftOperand: IExpression, public rightOperand: IExpression) { }
    public type = Boolean;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const left = resolveClone(this.leftOperand, replaceMap);
        const right = resolveClone(this.rightOperand, replaceMap);
        const clone = new EqualExpression(left, right);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCode("==", this.leftOperand.hashCode()) + hashCode("==", this.rightOperand.hashCode());
    }
    public toString(): string {
        return "(" + this.leftOperand.toString() + " == " + this.rightOperand.toString() + ")";
    }
}
