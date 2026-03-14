import type { IObjectType, SetterObj } from "../../Common/Type";
import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { IExpression } from "./IExpression";

export class ObjectValueExpression<T = unknown> implements IExpression<T> {
    constructor(objectValue: SetterObj<T>, type?: IObjectType<T>) {
        this.object = objectValue;
        this.type = type ? type : objectValue.constructor as IObjectType<T>;
    }
    public object: SetterObj<T>;
    public type: IObjectType<T>;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const obj: SetterObj<T> = {};
        for (const prop in this.object) {
            const propEx = this.object[prop];
            obj[prop] = resolveClone(propEx, replaceMap);
        }
        const clone = new ObjectValueExpression(obj, this.type);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        let hash = 0;
        for (const prop in this.object) {
            hash = hashCodeAdd(hash, hashCode(prop, this.object[prop].hashCode()));
        }
        return hash;
    }
    public toString(): string {
        const itemString = [];
        for (const item in this.object) {
            itemString.push(item + ": " + this.object[item].toString());
        }
        return "{" + itemString.join(", ") + "}";
    }
}
