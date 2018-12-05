import { GenericType, IObjectType } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
import { IMemberOperatorExpression } from "./IMemberOperatorExpression";
import { Queryable } from "../../Queryable/Queryable";
import { resolveClone, hashCode, hashCodeAdd } from "../../Helper/Util";

export class MethodCallExpression<TE = any, K extends keyof TE = any, T = any> implements IMemberOperatorExpression<TE, T> {
    public static create<TE, K extends keyof TE, T = any>(objectOperand: IExpression<TE>, params: IExpression[], methodName?: K, methodFn?: () => T) {
        const result = new MethodCallExpression(objectOperand, methodName ? methodName : methodFn!, params);
        if (objectOperand instanceof ValueExpression && params.every((param) => param instanceof ValueExpression)) {
            return ValueExpression.create(result);
        }

        return result;
    }
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
                if (Queryable.isPrototypeOf(objectType)) {
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
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        const paramStr = [];
        for (const param of this.params)
            paramStr.push(param.toString());
        return this.objectOperand.toString() + "." + this.methodName + "(" + paramStr.join(", ") + ")";
    }
    public execute(transformer?: ExpressionTransformer) {
        const objectValue = this.objectOperand.execute(transformer);
        const params = [];
        for (const param of this.params)
            params.push(param.execute(transformer));
        return (objectValue as any)[this.methodName].apply(objectValue, params);
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
