import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { BitwiseExpression } from "./BitwiseExpression";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { IExpression } from "./IExpression";
export class BitwiseZeroRightShiftExpression<T extends number | bigint> extends BitwiseExpression<T> implements IBinaryOperatorExpression<T> {
    constructor(leftOperand: IExpression, rightOperand: IExpression) {
        super();
        this.leftOperand = this.convertOperand(leftOperand);
        this.rightOperand = this.convertOperand(rightOperand);
    }
    public leftOperand: IExpression<T>;
    public rightOperand: IExpression<T>;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const left = resolveClone(this.leftOperand, replaceMap);
        const right = resolveClone(this.rightOperand, replaceMap);
        const clone = new BitwiseZeroRightShiftExpression<T>(left, right);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode(">>", this.leftOperand.hashCode()), this.rightOperand.hashCode());
    }

    public override toString(): string {
        return "(" + this.leftOperand.toString() + " >> " + this.rightOperand.toString() + ")";
    }
}
