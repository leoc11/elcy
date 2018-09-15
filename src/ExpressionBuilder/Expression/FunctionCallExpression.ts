import { ExpressionTransformer } from "../ExpressionTransformer";
import { ExpressionBase, IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
import { GenericType } from "../../Common/Type";
export class FunctionCallExpression<T = any> extends ExpressionBase<T> {
    public static create<T>(functionFn: ((...params: any[]) => T) | IExpression<(...params: any[]) => T>, params: IExpression[], functionName?: string) {
        let fnExp: IExpression<(...params: any[]) => T>;
        if ((functionFn as IExpression).type) {
            fnExp = functionFn as IExpression<(...params: any[]) => T>;
        }
        else {
            const fn = functionFn as (...params: any[]) => T;
            if (typeof functionName !== "string")
                functionName = fn.name;
            fnExp = new ValueExpression(fn);
        }

        const result = new FunctionCallExpression<T>(fnExp, params, functionName);
        if (fnExp instanceof ValueExpression && params.every((param) => param instanceof ValueExpression)) {
            return ValueExpression.create(result);
        }

        return result;
    }
    constructor(public fnExpression: IExpression<(...params: any[]) => T>, public params: IExpression[], functionName?: string) {
        super();
    }
    public get functionName() {
        return this.fnExpression.toString();
    }
    private _type: GenericType<T>;
    public get type() {
        if (!this._type) {
            try {
                const fn = this.fnExpression.execute();
                switch (fn as any) {
                    case parseInt:
                    case parseFloat:
                        this._type = Number as any;
                        break;
                    case decodeURI:
                    case decodeURIComponent:
                    case encodeURI:
                    case encodeURIComponent:
                        this._type = String as any;
                        break;
                    case isNaN:
                    case isFinite:
                        this._type = Boolean as any;
                        break;
                    case eval:
                        this._type = Function as any;
                        break;
                    default:
                        try { this._type = fn().constructor as any; } catch (e) { }
                }
            }
            catch (e) {
                return Object;
            }
        }

        return this._type;
    }
    public toString(transformer?: ExpressionTransformer): string {
        if (transformer)
            return transformer.getExpressionString(this);
        const paramStr = [];
        for (const param of this.params)
            paramStr.push(param.toString());
        return this.functionName + "(" + paramStr.join(", ") + ")";
    }
    public execute(transformer?: ExpressionTransformer) {
        const params = [];
        for (const param of this.params)
            params.push(param.execute(transformer));
        const fn = this.fnExpression.execute(transformer);
        return fn.apply(null, params);
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const fnExpression = replaceMap.has(this.fnExpression) ? replaceMap.get(this.fnExpression) : this.fnExpression.clone(replaceMap);
        const params = this.params.select(o => replaceMap.has(o) ? replaceMap.get(o) : o.clone(replaceMap)).toArray();
        return new FunctionCallExpression(fnExpression, params);
    }
}
