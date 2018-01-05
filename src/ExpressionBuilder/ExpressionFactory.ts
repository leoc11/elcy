import { genericType, IObjectType } from "../Common/Type";
import { ExpressionBase, IExpression } from "./Expression/IExpression";
import { FunctionExpression } from "./Expression/index";
import { ObjectValueExpression } from "./Expression/ObjectValueExpression";
import { ExpressionBuilder } from "./ExpressionBuilder";

export class ExpressionFactory {
    // tslint:disable-next-line:variable-name
    public GetExpressionFactory<T, K>(_fn: (source?: T) => K): () => IExpression<K> {
        return () => new ExpressionBase<K>();
    }

    public ToExpression<T, K = any, KE extends ({[key in keyof K]: any} | K) = any>(fn: (item?: T) => K, ctor: genericType<T>): FunctionExpression<T, KE> {
        return (new ExpressionBuilder()).ParseToExpression(fn.toString(), [ctor]);
    }
    public ToExpression2<T, T2, K = any, KE extends ({[key in keyof K]: any} | K) = any>(fn: (item?: T | null, item2?: T2 | null) => K, ctor: genericType<T>, ctor2: genericType<T2>): FunctionExpression<T, KE> {
        return (new ExpressionBuilder()).ParseToExpression(fn.toString(), [ctor, ctor2]);
    }
    public ToLiteralObjectExpression<T, K, KE extends {[key in keyof K]: IExpression}, KR extends { [key: string]: FunctionExpression<T, any> }>(fn: (item?: T) => K, sourceType: IObjectType<T>): KR {
        const expression = this.ToExpression(fn, sourceType);
        const objExpression = expression.Body as ObjectValueExpression<KE>;
        return Object.keys(objExpression.Object).reduce((result, cur: keyof K) => {
            result[cur] = FunctionExpression.Create<T, any>(objExpression.Object[cur], expression.Params);
            return result;
        }, {} as KR);
    }
}
