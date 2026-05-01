import { GenericType } from "src/Common/Type";
import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { IExpression } from "./IExpression";
export class NullCoalesceExpression<T = unknown> implements IBinaryOperatorExpression<T> {
    constructor(public leftOperand: IExpression<T>, public rightOperand: IExpression<T>) {
        this.type = leftOperand?.type ?? rightOperand?.type ?? Object;
     }
    public type: GenericType<T>;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const left = resolveClone(this.leftOperand, replaceMap);
        const right = resolveClone(this.rightOperand, replaceMap);
        const clone = new NullCoalesceExpression(left, right);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("??", this.leftOperand.hashCode()), this.rightOperand.hashCode());
    }
    public toString(): string {
        return "(" + this.leftOperand.toString() + " ?? " + this.rightOperand.toString() + ")";
    }
}
