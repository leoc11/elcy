import { GenericType, IObjectType } from "../Common/Type";
import { IExpression } from "./Expression/IExpression";
import { FunctionExpression, ParameterExpression } from "./Expression/index";
import { ObjectValueExpression } from "./Expression/ObjectValueExpression";
import { ExpressionBuilder } from "./ExpressionBuilder";

export class ExpressionFactory {
    // tslint:disable-next-line:variable-name
    public GetExpressionFactory<T, K>(_fn: (source?: T) => K): () => IExpression<K> {
        return () => new FunctionExpression<K>(null as any, []);
    }

    public ToExpression<T, K = any, KE extends ({ [key in keyof K]: any } | K) = any>(fn: (item?: T) => K, ctor: GenericType<T>, paramName?: string): FunctionExpression<T, KE> {
        return (new ExpressionBuilder()).ParseToExpression(fn.toString(), [ctor]);
    }
    public ToExpressionParam<T, K = any, KE extends ({ [key in keyof K]: any } | K) = any>(fn: (item?: T) => K, param: ParameterExpression<T>): FunctionExpression<T, KE> {
        // TODO, create expression with parameter.
        return (new ExpressionBuilder()).ParseToExpression(fn.toString(), []);
    }
    public ToExpression2<T, T2, K = any, KE extends ({ [key in keyof K]: any } | K) = any>(fn: (item?: T | null, item2?: T2 | null) => K, ctor: GenericType<T>, ctor2: GenericType<T2>): FunctionExpression<T, KE> {
        return (new ExpressionBuilder()).ParseToExpression(fn.toString(), [ctor, ctor2]);
    }
    public ToLiteralObjectExpression<T, K, KE extends { [key in keyof K]: IExpression }, KR extends { [key: string]: FunctionExpression<T, any> }>(fn: (item?: T) => K, sourceType: IObjectType<T>): KR {
        const expression = this.ToExpression(fn, sourceType);
        const objExpression = expression.body as ObjectValueExpression<KE>;
        return Object.keys(objExpression.object).reduce((result, cur: keyof K) => {
            result[cur] = FunctionExpression.Create<T, any>(objExpression.object[cur], expression.params);
            return result;
        }, {} as KR);
    }
    public ToFunctionObjectValueExpression<T, K, KE extends { [key in keyof K]: FunctionExpression<T, any> | ((item: T) => any) }>(objectFn: KE, sourceType: IObjectType<T>, paramName: string): FunctionExpression<T, { [key in keyof KE]?: IExpression }> {
        const param = new ParameterExpression(paramName, sourceType);
        const objectValue: { [key in keyof KE]?: IExpression } = {};
        for (const prop in objectFn) {
            const value = objectFn[prop];
            let fnExpression: FunctionExpression<T, any>;
            if (value instanceof FunctionExpression)
                fnExpression = value;
            else
                fnExpression = this.ToExpression(value as (item: T) => any, sourceType);
            objectValue[prop] = fnExpression.body;
        }
        const objExpression = new ObjectValueExpression(objectValue);
        return new FunctionExpression(objExpression, [param]);
    }
}
