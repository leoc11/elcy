import { IObjectType, NullConstructor } from "../../Common/Type";
import { IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
import { resolveClone, hashCodeAdd, hashCode } from "../../Helper/Util";
export class InstantiationExpression<T = any> implements IExpression<T> {
    constructor(public typeOperand: ValueExpression<IObjectType<T>>, public params: IExpression[]) { }
    public get type() {
        try {
            return this.typeOperand.value;
        }
        catch (e) { return NullConstructor; }
    }
    public toString(): string {
        const paramStr = [];
        for (const param of this.params)
            paramStr.push(param.toString());
        return "new " + this.typeOperand.toString() + "(" + paramStr.join(", ") + ")";
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const typeOperand = resolveClone(this.typeOperand, replaceMap);
        const params = this.params.select(o => resolveClone(o, replaceMap)).toArray();
        const clone = new InstantiationExpression(typeOperand, params);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        let hash = hashCodeAdd(this.typeOperand.hashCode(), hashCode("new"));
        this.params.each((o, i) => hash = hashCodeAdd(hash, hashCodeAdd(i, o.hashCode())));
        return hash;
    }
}
