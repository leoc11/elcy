import { GenericType } from "../../Common/Type";
import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
import { IMemberOperatorExpression } from "./IMemberOperatorExpression";
export class MethodCallExpression<TType, KProp extends keyof TType, TResult = any> extends ExpressionBase<TResult> implements IMemberOperatorExpression<TType, TResult> {
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
                try {
                    this.type = this.objectOperand.type.prototype[this.methodName]().constructor;
                } catch (e) {
                    this.type = (new (this.objectOperand.type as any)())[this.methodName]().constructor;
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
        const objectOperand = replaceMap.has(this.objectOperand) ? replaceMap.get(this.objectOperand) : this.objectOperand.clone(replaceMap);
        const params = this.params.select(o => replaceMap.has(o) ? replaceMap.get(o) : o.clone(replaceMap)).toArray();
        return new MethodCallExpression(objectOperand, this.methodName as any, params, this.type);
    }
}
