import { hashCode, resolveClone } from "../../Helper/Util";
import { BitwiseExpression } from "./BitwiseExpression";
import { IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
export class BitwiseNotExpression<T extends number | bigint> extends BitwiseExpression<T> implements IUnaryOperatorExpression<T> {
    constructor(operand: IExpression) {
        super(operand.type);
        this.operand = this.convertOperand(operand);
    }
    public operand: IExpression<number | bigint>;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const operand = resolveClone(this.operand, replaceMap);
        const clone = new BitwiseNotExpression<T>(operand);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCode("~", this.operand.hashCode());
    }

    public override toString(): string {
        return "~" + this.operand.toString();
    }
}
