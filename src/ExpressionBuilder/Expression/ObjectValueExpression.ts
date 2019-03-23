import { IObjectType } from "../../Common/Type";
import { IExpression } from "./IExpression";
import { resolveClone, hashCodeAdd, hashCode } from "../../Helper/Util";

export class ObjectValueExpression<T = any> implements IExpression<T> {
    public object: { [key in keyof T]?: IExpression<T[key]> };
    public type: IObjectType<T>;
    constructor(objectValue: { [key in keyof T]?: IExpression<T[key]> }, type?: IObjectType<T>) {
        this.object = objectValue;
        this.type = type ? type : objectValue.constructor as IObjectType<T>;
    }
    public toString(): string {
        const itemString = [];
        for (const item in this.object)
            itemString.push(item + ": " + this.object[item].toString());
        return "{" + itemString.join(", ") + "}";
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const obj: { [key in keyof T]?: IExpression<T[key]> } = {};
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
}
