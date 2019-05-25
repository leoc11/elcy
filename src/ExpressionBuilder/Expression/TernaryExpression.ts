import { GenericType, NullConstructor } from "../../Common/Type";
import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { IExpression } from "./IExpression";
export class TernaryExpression<T1 = any, T2 = any> implements IExpression<T1 | T2> {
    public get type(): GenericType<T1 | T2> {
        if (this.trueOperand.type as any === this.falseOperand.type) {
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

    constructor(public logicalOperand: IExpression<boolean>, public trueOperand: IExpression<T1>, public falseOperand: IExpression<T2>) { }
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
