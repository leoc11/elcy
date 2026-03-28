import { PrimitiveType } from "src/Common/Type";
import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { IExpression } from "./IExpression";
export class StrictNotEqualExpression<T = unknown> implements IBinaryOperatorExpression<boolean> {
    constructor(public leftOperand: IExpression<T>, public rightOperand: IExpression<T>) { }
    public type: PrimitiveType<boolean> = Boolean;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const left = resolveClone(this.leftOperand, replaceMap);
        const right = resolveClone(this.rightOperand, replaceMap);
        const clone = new StrictNotEqualExpression(left, right);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("!==", this.leftOperand.hashCode()), this.rightOperand.hashCode());
    }
    public toString(): string {
        return "(" + this.leftOperand.toString() + " !== " + this.rightOperand.toString() + ")";
    }
}
