import { GenericType, IObjectType } from "../Common/Type";
import { IExpression } from "./Expression/IExpression";
import { FunctionExpression, ParameterExpression } from "./Expression/index";
import { ObjectValueExpression } from "./Expression/ObjectValueExpression";
import { ExpressionBuilder } from "./ExpressionBuilder";
import { type } from "os";

export class ExpressionFactory {
    // tslint:disable-next-line:variable-name
    public GetExpressionFactory<T, K>(_fn: (source?: T) => K): () => IExpression<K> {
        return () => new FunctionExpression<K>(null as any, []);
    }

    public ToExpression<T, K = any, KE extends ({[key in keyof K]: any} | K) = any>(fn: (item?: T) => K, ctor: GenericType<T>): FunctionExpression<T, KE> {
        return (new ExpressionBuilder()).ParseToExpression(fn.toString(), [ctor]);
    }
    public ToExpression2<T, T2, K = any, KE extends ({[key in keyof K]: any} | K) = any>(fn: (item?: T | null, item2?: T2 | null) => K, ctor: GenericType<T>, ctor2: GenericType<T2>): FunctionExpression<T, KE> {
        return (new ExpressionBuilder()).ParseToExpression(fn.toString(), [ctor, ctor2]);
    }
    public ToLiteralObjectExpression<T, K, KE extends {[key in keyof K]: IExpression}, KR extends { [key: string]: FunctionExpression<T, any> }>(fn: (item?: T) => K, sourceType: IObjectType<T>): KR {
        const expression = this.ToExpression(fn, sourceType);
        const objExpression = expression.body as ObjectValueExpression<KE>;
        return Object.keys(objExpression.object).reduce((result, cur: keyof K) => {
            result[cur] = FunctionExpression.Create<T, any>(objExpression.object[cur], expression.params);
            return result;
        }, {} as KR);
    }
    public ToObjectValueExpression<T, K, KE extends {[key in keyof K]: IExpression}, KR extends { [key: string]: FunctionExpression<T, any> }>(objectFn: KE, sourceType: IObjectType<T>): ObjectValueExpression<KR> {
        const params = [new ParameterExpression("o", sourceType)];
        const obj = Object.keys(objectFn).reduce((result, cur: keyof K) => {
            result[cur] = FunctionExpression.Create<T, any>(objectFn[cur], params);
            return result;
        }, {} as KR);
        return new ObjectValueExpression(obj);
    }
}
