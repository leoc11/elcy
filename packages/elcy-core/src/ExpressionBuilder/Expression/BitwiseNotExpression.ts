import { hashCode, resolveClone } from "../../Helper/Util";
import { BitwiseExpression } from "./BitwiseExpression";
import { IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
export class BitwiseNotExpression extends BitwiseExpression implements IUnaryOperatorExpression<number> {
    constructor(operand: IExpression) {
        super();
        this.operand = this.convertOperand(operand);
    }
    public operand: IExpression<number>;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const operand = resolveClone(this.operand, replaceMap);
        const clone = new BitwiseNotExpression(operand);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCode("~", this.operand.hashCode());
    }

    public toString(): string {
        return "~" + this.operand.toString();
    }
}
