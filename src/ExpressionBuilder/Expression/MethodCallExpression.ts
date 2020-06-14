import { GenericType } from "../../Common/Type";
import { Enumerable } from "../../Enumerable/Enumerable";
import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { Queryable } from "../../Queryable/Queryable";
import { IExpression } from "./IExpression";
import { IMemberOperatorExpression } from "./IMemberOperatorExpression";

export class MethodCallExpression<TE = any, K extends keyof TE = any, T = any> implements IMemberOperatorExpression<TE, T> {
    public get itemType() {
        if ((this.type as any) === Array) {
            return this.objectOperand.itemType;
        }
        return null;
    }
    public get type() {
        if (!this._type && this.objectOperand.type) {
            try {
                const objectType = this.objectOperand.type as any;
                if (objectType === Array || Queryable.isPrototypeOf(objectType) || Enumerable.isPrototypeOf(objectType)) {
                    switch (this.methodName) {
                        case "min":
                        case "max":
                        case "count":
                        case "sum": {
                            this._type = Number as any;
                            break;
                        }
                        case "contains":
                        case "any":
                        case "all": {
                            this._type = Boolean as any;
                            break;
                        }
                        case "first": {
                            this._type = this.objectOperand.itemType;
                            break;
                        }
                        default: {
                            this._type = Array as any;
                            break;
                        }
                    }
                }
                else if (objectType === Date) {
                    const objectInstance = new objectType();
                    this.type = (objectInstance[this.methodName] as any)().constructor;
                }
                else {
                    this.type = objectType.prototype[this.methodName]().constructor;
                }
            }
            catch (e) {
                this._type = Object;
            }
        }
        return this._type;
    }
    public set type(value) {
        this._type = value;
    }
    constructor(public objectOperand: IExpression<TE>, method: K | (() => T), public params: IExpression[], type?: GenericType<T>) {
        this._type = type;
        if (typeof method === "function") {
            this.methodName = method.name as any;
        }
        else {
            this.methodName = method;
        }
    }
    public methodName: K;
    private _type: GenericType<T>;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const objectOperand = resolveClone(this.objectOperand, replaceMap);
        const params = this.params.select((o) => resolveClone(o, replaceMap)).toArray();
        const clone = new MethodCallExpression(objectOperand, this.methodName as K, params, this.type);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        let hash = hashCode("." + this.methodName, this.objectOperand.hashCode());
        this.params.forEach((o, i) => hash = hashCodeAdd(hash, hashCodeAdd(i, o.hashCode())));
        return hash;
    }
    public toString(): string {
        const paramStr = [];
        for (const param of this.params) {
            paramStr.push(param.toString());
        }
        return this.objectOperand.toString() + "." + this.methodName + "(" + paramStr.join(", ") + ")";
    }
}
