import { GenericType } from "../../Common/Type";
import { resolveClone } from "../../Helper/Util";
import { IExpression } from "./IExpression";
import { ObjectValueExpression } from "./ObjectValueExpression";
import { ParameterExpression } from "./ParameterExpression";

const FunctionTypeConstructor: () => ((...param: any[]) => any) = () => (() => {});
export class FunctionExpression<T = unknown, K = unknown> implements IExpression<(...param: K[]) => T> {
    // TODO: type must always specified
    constructor(body?: IExpression<T>, params?: ParameterExpression<K>[], type?: GenericType<T>) {
        this.body = body;
        this.params = params;
        this.returnType = type;
        this.type = FunctionTypeConstructor;
    }
    private _body: IExpression<T>;
    public get body(): IExpression<T> {
        return this._body;
    }
    public set body(value: IExpression<T>) {
        this._body = value;
    }
    private _params: ParameterExpression<K>[];
    public get params(): ParameterExpression<K>[] {
        return this._params;
    }
    public set params(value: ParameterExpression<K>[]) {
        this._params = value;
    }
    private _returnType?: GenericType<T>;
    public get returnType(): GenericType<T> {
        return this._returnType;
    }
    public set returnType(value: GenericType<T>) {
        this._returnType = value;
    }
    private _type: GenericType<(...param: K[]) => T>;
    public get type(): GenericType<(...param: K[]) => T> {
        return this._type;
    }
    public set type(value: GenericType<(...param: K[]) => T>) {
        this._type = value;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const params = this.params.map((o) => resolveClone(o, replaceMap));
        const body = resolveClone(this.body, replaceMap);
        const clone = new FunctionExpression(body, params);
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return this.body.hashCode();
    }

    public toString(): string {
        const params = [];
        for (const param of this.params) {
            params.push(param.toString());
        }

        if (this.body instanceof ObjectValueExpression) {
            return "(" + params.join(", ") + ") => (" + this.body.toString() + ")";
        }
        return "(" + params.join(", ") + ") => " + this.body.toString();
    }
}
