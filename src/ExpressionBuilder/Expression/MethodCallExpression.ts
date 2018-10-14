import { GenericType } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
import { IMemberOperatorExpression } from "./IMemberOperatorExpression";
import { Queryable } from "../../Queryable/Queryable";
import { resolveClone } from "../../Helper/Util";

export class MethodCallExpression<TType = any, KProp extends keyof TType = any, TResult = any> extends ExpressionBase<TResult> implements IMemberOperatorExpression<TType, TResult> {
    public static create<TType, KProp extends keyof TType, TResult = any>(objectOperand: IExpression<TType>, params: IExpression[], methodName?: KProp, methodFn?: () => TResult) {
        const result = new MethodCallExpression(objectOperand, methodName ? methodName : methodFn!, params);
        if (objectOperand instanceof ValueExpression && params.every((param) => param instanceof ValueExpression)) {
            return ValueExpression.create(result);
        }

        return result;
    }
    public methodName: string;
    constructor(public objectOperand: IExpression<TType>, method: KProp | (() => TResult), public params: IExpression[], type?: GenericType<TResult>) {
        super(type);
        if (typeof method === "function") {
            this.methodName = method.name;
        }
        else {
            this.methodName = method;
        }
    }
    private _type: GenericType<TResult>;
    public get type() {
        if (!this._type && this.objectOperand.type) {
            try {
                if (Queryable.isPrototypeOf(this.objectOperand.type)) {
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
                        this.type = this.objectOperand.type.prototype[this.methodName]().constructor;
                    } catch (e) {
                        this.type = (new (this.objectOperand.type as any)())[this.methodName]().constructor;
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
        const clone = new MethodCallExpression(objectOperand, this.methodName as KProp, params, this.type);
        replaceMap.set(this, clone);
        return clone;
    }
}
