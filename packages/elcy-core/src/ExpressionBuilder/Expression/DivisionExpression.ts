import { PrimitiveType } from "src/Common/Type";
import { resolveClone } from "../../Helper/Expression";
import { hashCode, hashCodeAdd } from "../../Helper/Hash";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { IExpression } from "./IExpression";
export class DivisionExpression implements IBinaryOperatorExpression<number> {
    constructor(public leftOperand: IExpression<number>, public rightOperand: IExpression<number>) { }
    public type: PrimitiveType<number> = Number;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const left = resolveClone(this.leftOperand, replaceMap);
        const right = resolveClone(this.rightOperand, replaceMap);
        const clone = new DivisionExpression(left, right);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode("/", this.leftOperand.hashCode()), this.rightOperand.hashCode());
    }

    public toString(): string {
        return "(" + this.leftOperand.toString() + " / " + this.rightOperand.toString() + ")";
    }
}
