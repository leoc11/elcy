import type { ElementType, GenericType, IObjectType, MethodKey, MethodReturnType } from "../../Common/Type";
import { Enumerable } from "@elcy/enumerable";
import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { Queryable } from "../../Queryable/Queryable";
import { IExpression } from "./IExpression";
import { IMemberOperatorExpression } from "./IMemberOperatorExpression";

export class MethodCallExpression<TE = unknown, K extends MethodKey<TE> = MethodKey<TE>, T = MethodReturnType<TE, K>> implements IMemberOperatorExpression<TE, T> {
    public get itemType() {
        if ((this.type as GenericType<ElementType<T>[]>) === Array) {
            return this.objectOperand.itemType;
        }
        return null;
    }
    public get type() {
        if (!this._type && this.objectOperand.type) {
            try {
                const objectType = this.objectOperand.type;
                if ((objectType as GenericType<ElementType<T>[]>) == Array || Object.prototype.isPrototypeOf.call(Queryable, objectType) || Object.prototype.isPrototypeOf.call(Enumerable, objectType)) {
                    switch (this.methodName) {
                        case "min":
                        case "max":
                        case "count":
                        case "sum": {
                            (this._type as GenericType<number>) = Number;
                            break;
                        }
                        case "includes":
                        case "some":
                        case "every": {
                            (this._type as GenericType<boolean>) = Boolean;
                            break;
                        }
                        case "find": {
                            this._type = this.objectOperand.itemType as GenericType<T>;
                            break;
                        }
                        default: {
                            this._type = Array as GenericType<ElementType<T>[]> as GenericType<T>;
                            break;
                        }
                    }
                }
                else {
                    try {
                        const proto = objectType.prototype as TE;
                        this.type = (proto[this.methodName] as () => T)().constructor as GenericType<T>;
                    } catch {
                        const objectInstance = new (objectType as IObjectType<TE>)();
                        this.type = (objectInstance[this.methodName] as () => T)().constructor as GenericType<T>;
                    }
                }
            }
            catch {
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
            this.methodName = method.name as K;
        }
        else {
            this.methodName = method;
        }
    }
    public methodName: K;
    public isOptional?: boolean;
    private _type: GenericType<T>;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const objectOperand = resolveClone(this.objectOperand, replaceMap);
        const params = this.params.map((o) => resolveClone(o, replaceMap));
        const clone = new MethodCallExpression(objectOperand, this.methodName, params, this.type);
        clone.isOptional = this.isOptional;
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        let hash = hashCode(`${this.isOptional ? "?" : ""}.${this.methodName}`, this.objectOperand.hashCode());
        this.params.forEach((o, i) => hash = hashCodeAdd(hash, hashCodeAdd(i, o.hashCode())));
        return hash;
    }
    public toString(): string {
        return `${this.objectOperand}${this.isOptional ? "?" : ""}.${this.methodName}(${this.params.join(", ")})`;
    }
}
