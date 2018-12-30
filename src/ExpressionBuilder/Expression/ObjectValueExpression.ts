import { IObjectType } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
import { resolveClone, hashCodeAdd, hashCode } from "../../Helper/Util";

export class ObjectValueExpression<T = any> implements IExpression<T> {
    public static create<T extends { [Key: string]: IExpression }>(objectValue: T) {
        const result = new ObjectValueExpression(objectValue);
        let isAllValue = Object.keys(objectValue).all(o => objectValue[o] instanceof ValueExpression);
        if (isAllValue)
            return ValueExpression.create<T>(objectValue);

        return result;
    }
    public object: { [key in keyof T]?: IExpression };
    public type: IObjectType<T>;
    constructor(objectValue: { [key in keyof T]?: IExpression }, type?: IObjectType<T>) {
        this.object = objectValue;
        this.type = type ? type : objectValue.constructor as IObjectType<T>;
    }
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        const itemString = [];
        for (const item in this.object)
            itemString.push(item + ": " + this.object[item].toString());
        return "{" + itemString.join(", ") + "}";
    }
    public execute(transformer: ExpressionTransformer): T {
        const objectValue: T = {} as any;
        for (const prop in this.object)
            objectValue[prop] = this.object[prop].execute(transformer);
        return objectValue;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const obj: { [key in keyof T]?: IExpression } = {};
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
