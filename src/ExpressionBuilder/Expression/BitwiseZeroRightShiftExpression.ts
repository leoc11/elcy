import { BitwiseExpression } from "./BitwiseExpression";
import { IBinaryOperatorExpression } from "./IBinaryOperatorExpression";
import { IExpression } from "./IExpression";
import { resolveClone, hashCode, hashCodeAdd } from "../../Helper/Util";
export class BitwiseZeroRightShiftExpression extends BitwiseExpression implements IBinaryOperatorExpression<number> {
    public leftOperand: IExpression<number>;
    public rightOperand: IExpression<number>;
    constructor(leftOperand: IExpression, rightOperand: IExpression) {
        super();
        this.leftOperand = this.convertOperand(leftOperand);
        this.rightOperand = this.convertOperand(rightOperand);
    }

    public toString(): string {
        return "(" + this.leftOperand.toString() + " >>> " + this.rightOperand.toString() + ")";
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const left = resolveClone(this.leftOperand, replaceMap);
        const right = resolveClone(this.rightOperand, replaceMap);
        const clone = new BitwiseZeroRightShiftExpression(left, right);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCode(">>>", this.leftOperand.hashCode()), this.rightOperand.hashCode());
    }
}
