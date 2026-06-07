import { GenericType, PrimitiveType } from "../../Common/Type";
import { resolveClone } from "../../Helper/Expression";
import { IExpression } from "./IExpression";
import { ParameterExpression } from "./ParameterExpression";

type ParameterTupleExp<T extends readonly unknown[]> = {
    [K in keyof T]: ParameterExpression<T[K]>;
};
const FunctionTypeConstructor: () => ((...param: any[]) => any) = () => (() => { });
export class FunctionExpression<T = unknown, TArgs extends readonly unknown[] = []> implements IExpression<(...param: TArgs) => T> {
    // TODO: type must always specified
    constructor(body?: IExpression<T>, params?: ParameterTupleExp<TArgs>, type?: PrimitiveType<T>);
    constructor(body?: IExpression<T>, params?: ParameterTupleExp<TArgs>, type?: GenericType<T>);
    constructor(body?: IExpression<T>, params?: ParameterTupleExp<TArgs>, type?: GenericType<T>) {
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
    private _params: ParameterTupleExp<TArgs>;
    public get params() {
        return this._params;
    }
    public set params(value: ParameterTupleExp<TArgs>) {
        this._params = value;
    }
    private _returnType?: GenericType<T>;
    public get returnType(): GenericType<T> {
        return this._returnType;
    }
    public set returnType(value: GenericType<T>) {
        this._returnType = value;
    }
    private _type: GenericType<(...param: TArgs) => T>;
    public get type(): GenericType<(...param: TArgs) => T> {
        return this._type;
    }
    public set type(value: GenericType<(...param: TArgs) => T>) {
        this._type = value;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const params = this.params.map((o) => resolveClone(o, replaceMap)) as ParameterTupleExp<TArgs>;
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
            params.push((param as ParameterExpression<T[keyof T]>).toString());
        }

        let body = this.body.toString();
        if (body.startsWith("{")) {
            body = `(${body})`;
        }
        return `(${params.join(", ")}) => ${body}`;
    }
}
