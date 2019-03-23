import { IExpression } from "./IExpression";
import { GenericType, NullConstructor } from "../../Common/Type";
import { resolveClone, hashCode, hashCodeAdd } from "../../Helper/Util";
export class TernaryExpression<T1 = any, T2 = any> implements IExpression<T1 | T2> {
    public get type(): GenericType<T1 | T2> {
        if (this.trueResultOperand.type as any === this.falseResultOperand.type) {
            return this.trueResultOperand.type;
        }
        else if (this.trueResultOperand.type === NullConstructor) {
            return this.falseResultOperand.type;
        }
        else if (this.falseResultOperand.type === NullConstructor) {
            return this.trueResultOperand.type;
        }

        return Object;
    }

    constructor(public logicalOperand: IExpression<boolean>, public trueResultOperand: IExpression<T1>, public falseResultOperand: IExpression<T2>) { }
    public toString(): string {
        return "(" + this.logicalOperand.toString() + " ? " + this.trueResultOperand.toString() + " : " + this.falseResultOperand.toString() + ")";
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const logicalOperand = resolveClone(this.logicalOperand, replaceMap);
        const trueResultOperand = resolveClone(this.trueResultOperand, replaceMap);
        const falseResultOperand = resolveClone(this.falseResultOperand, replaceMap);
        const clone = new TernaryExpression(logicalOperand, trueResultOperand, falseResultOperand);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCodeAdd(hashCodeAdd(hashCode(":", hashCode("?", this.logicalOperand.hashCode())), this.trueResultOperand.hashCode()), this.falseResultOperand.hashCode());
    }
}
