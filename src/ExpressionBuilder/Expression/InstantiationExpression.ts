import { IObjectType, NullConstructor } from "../../Common/Type";
import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class InstantiationExpression<T = any> implements IExpression<T> {
    public get type() {
        try {
            return this.typeOperand.value;
        }
        catch (e) {
            return NullConstructor;
        }
    }
    constructor(public typeOperand: ValueExpression<IObjectType<T>>, public params: IExpression[]) { }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const typeOperand = resolveClone(this.typeOperand, replaceMap);
        const params = this.params.select((o) => resolveClone(o, replaceMap)).toArray();
        const clone = new InstantiationExpression(typeOperand, params);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        let hash = hashCodeAdd(this.typeOperand.hashCode(), hashCode("new"));
        this.params.forEach((o, i) => hash = hashCodeAdd(hash, hashCodeAdd(i, o.hashCode())));
        return hash;
    }
    public toString(): string {
        const paramStr = [];
        for (const param of this.params) {
            paramStr.push(param.toString());
        }
        return "new " + this.typeOperand.toString() + "(" + paramStr.join(", ") + ")";
    }
}
