import { hashCode, resolveClone } from "../../Helper/Util";
import { IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
import { ParameterExpression } from "./ParameterExpression";
export class RightDecrementExpression implements IUnaryOperatorExpression<number> {
    constructor(public readonly operand: ParameterExpression<number>) { }
    public type = Number;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const operand = resolveClone(this.operand, replaceMap);
        const clone = new RightDecrementExpression(operand);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCode("--", this.operand.hashCode());
    }
    public toString(): string {
        return this.operand.toString() + "--";
    }
}
