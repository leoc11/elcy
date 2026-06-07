import { PrimitiveType } from "src/Common/Type";
import { resolveClone } from "../../Helper/Expression";
import { hashCode } from "../../Helper/Hash";
import { IExpression } from "./IExpression";
import { IUnaryOperatorExpression } from "./IUnaryOperatorExpression";
import { ParameterExpression } from "./ParameterExpression";
export class RightDecrementExpression implements IUnaryOperatorExpression<number> {
    constructor(public readonly operand: ParameterExpression<number>) { }
    public type: PrimitiveType<number> = Number;
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
