import type { GenericType } from "../../Common/Type";
import type { IExpression } from "./IExpression";
import { NullConstructor } from "../../Common/Constant";
import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";

export class TernaryExpression<T = unknown> implements IExpression<T> {
    public get type(): GenericType<T> {
        if (this.trueOperand.type === this.falseOperand.type) {
            return this.trueOperand.type;
        }
        else if (this.trueOperand.type === NullConstructor) {
            return this.falseOperand.type;
        }
        else if (this.falseOperand.type === NullConstructor) {
            return this.trueOperand.type;
        }

        return Object;
    }

    constructor(public logicalOperand: IExpression<boolean>, public trueOperand: IExpression<T>, public falseOperand: IExpression<T>) { }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const logicalOperand = resolveClone(this.logicalOperand, replaceMap);
        const trueResultOperand = resolveClone(this.trueOperand, replaceMap);
        const falseResultOperand = resolveClone(this.falseOperand, replaceMap);
        const clone = new TernaryExpression(logicalOperand, trueResultOperand, falseResultOperand);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCodeAdd(hashCode(":", hashCode("?", this.logicalOperand.hashCode())), this.trueOperand.hashCode()), this.falseOperand.hashCode());
    }
    public toString(): string {
        return "(" + this.logicalOperand.toString() + " ? " + this.trueOperand.toString() + " : " + this.falseOperand.toString() + ")";
    }
}
