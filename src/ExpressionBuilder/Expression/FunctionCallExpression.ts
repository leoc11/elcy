import { GenericType } from "../../Common/Type";
import { hashCode, hashCodeAdd, resolveClone } from "../../Helper/Util";
import { IExpression } from "./IExpression";
import { ValueExpression } from "./ValueExpression";
export class FunctionCallExpression<T = any> implements IExpression<T> {
    public get type() {
        if (!this._type) {
            if (this.fnExpression instanceof ValueExpression) {
                try {
                    const fn = this.fnExpression.value;
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
        }

        return this._type;
    }
    constructor(fnExpression: IExpression<(...params: any[]) => T> | ((...params: any[]) => T), params: IExpression[], functionName?: string) {
        if (fnExpression instanceof Function) {
            functionName = fnExpression.name;
            fnExpression = new ValueExpression(fnExpression);
        }
        else {
            functionName = fnExpression.toString();
        }
        this.fnExpression = fnExpression;
        this.params = params;
        this.functionName = functionName;
    }
    public fnExpression: IExpression<(...params: any[]) => T>;
    public functionName: string;
    public params: IExpression[];
    private _type: GenericType<T>;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const fnExpression = resolveClone(this.fnExpression, replaceMap);
        const params = this.params.select((o) => resolveClone(o, replaceMap)).toArray();
        const clone = new FunctionCallExpression(fnExpression, params);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        let hash = hashCode(this.functionName);
        this.params.forEach((o, i) => hash = hashCodeAdd(hash, hashCodeAdd(i, o.hashCode())));
        return hash;
    }
    public toString(): string {
        const paramStr = [];
        for (const param of this.params) {
            paramStr.push(param.toString());
        }
        return this.functionName + "(" + paramStr.join(", ") + ")";
    }
}
