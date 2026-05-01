import { PrimitiveType } from "src/Common/Type";
import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { IExpression } from "./IExpression";
import { IMultiOperatorExpression } from "./IMultiOperatorExpression";
import { Enumerable } from "@elcy/enumerable";
export class OrExpression implements IMultiOperatorExpression<boolean> {
    constructor(...operands: IExpression<boolean>[]) {
        this.operands = operands.flatMap(o => o instanceof OrExpression ? o.operands : o);
    }
    public type: PrimitiveType<boolean> = Boolean;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const operands = this.operands.map(o => resolveClone(o, replaceMap));
        const clone = new OrExpression(...operands);
        replaceMap.set(this, clone);
        return clone;
    }
    public operands: IExpression<boolean>[];
    public asOperand(): IExpression<boolean> | undefined {
        if (this.operands.length <= 1) {
            return this.operands[0];
        }

        return this;
    }
    public hashCode() {
        return this.operands.reduce((r, o) => r ? hashCodeAdd(hashCode("||", r), o.hashCode()) : o.hashCode(), 0);
    }
    public toString(): string {
        return "(" + Enumerable.from(this.operands).map(o => o.toString()).join(" || ") + ")";
    }
}
