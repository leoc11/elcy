import { GenericType, IObjectType } from "../../Common/Type";
import { IExpression } from "./IExpression";
import { IMemberOperatorExpression } from "./IMemberOperatorExpression";
import { resolveClone, hashCode, hashCodeAdd } from "../../Helper/Util";
import { Queryable } from "../../Queryable/Queryable";
import { Enumerable } from "../../Enumerable/Enumerable";

export class MethodCallExpression<TE = any, K extends keyof TE = any, T = any> implements IMemberOperatorExpression<TE, T> {
    public methodName: K;
    constructor(public objectOperand: IExpression<TE>, method: K | (() => T), public params: IExpression[], type?: GenericType<T>) {
        this.type = type;
        if (typeof method === "function") {
            this.methodName = method.name as any;
        }
        else {
            this.methodName = method;
        }
    }
    private _type: GenericType<T>;
    public get type() {
        if (!this._type && this.objectOperand.type) {
            try {
                const objectType = this.objectOperand.type as IObjectType<TE>;
                if (Queryable.isPrototypeOf(objectType) || Enumerable.isPrototypeOf(objectType)) {
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
                            this._type = Object;
                            break;
                        }
                        default: {
                            this._type = Array as any;
                            break;
                        }
                    }
                }
                else {
                    try {
                        this.type = objectType.prototype[this.methodName]().constructor;
                    } catch (e) {
                        const objectInstance = new objectType();
                        this.type = (objectInstance[this.methodName] as any)().constructor;
                    }
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
    public toString(): string {
        const paramStr = [];
        for (const param of this.params)
            paramStr.push(param.toString());
        return this.objectOperand.toString() + "." + this.methodName + "(" + paramStr.join(", ") + ")";
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const objectOperand = resolveClone(this.objectOperand, replaceMap);
        const params = this.params.select(o => resolveClone(o, replaceMap)).toArray();
        const clone = new MethodCallExpression(objectOperand, this.methodName as K, params, this.type);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        let hash = hashCode("." + this.methodName, this.objectOperand.hashCode());
        this.params.each((o, i) => hash = hashCodeAdd(hash, hashCodeAdd(i, o.hashCode())));
        return hash;
    }
}
