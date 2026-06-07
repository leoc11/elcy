import { GenericType, PrimitiveType } from "../../Common/Type";
import { resolveClone } from "../../Helper/Expression";
import { hashCode, hashCodeAdd } from "../../Helper/Hash";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { IExpression } from "./IExpression";
export class InstanceofExpression<T> implements IBinaryOperatorExpression<boolean> {
    constructor(public leftOperand: IExpression<T>, public rightOperand: IExpression<GenericType<T>>) { }
    public type: PrimitiveType<boolean> = Boolean;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const left = resolveClone(this.leftOperand, replaceMap);
        const right = resolveClone(this.rightOperand, replaceMap);
        const clone = new InstanceofExpression(left, right);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("instanceof", this.leftOperand.hashCode()), this.rightOperand.hashCode());
    }
    public toString(): string {
        return "(" + this.leftOperand.toString() + " instanceof " + this.rightOperand.toString() + ")";
    }
}
