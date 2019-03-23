import { IQueryTranslatorItem } from "./IQueryTranslatorItem";
import { FunctionCallExpression } from "../../ExpressionBuilder/Expression/FunctionCallExpression";
import { IUnaryOperatorExpression } from "../../ExpressionBuilder/Expression/IUnaryOperatorExpression";
import { IBinaryOperatorExpression } from "../../ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { TernaryExpression } from "../../ExpressionBuilder/Expression/TernaryExpression";
import { IQueryBuilder } from "../../Query/IQueryBuilder";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IObjectType, GenericType } from "../../Common/Type";
import { MemberAccessExpression } from "../../ExpressionBuilder/Expression/MemberAccessExpression";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { IQueryBuilderParameter } from "../../Query/IQueryBuilderParameter";

export class QueryTranslator {
    private _map = new Map<any, { [key: string]: IQueryTranslatorItem }>();
    constructor(public key: symbol) { }
    public registerFn<T, TExp extends FunctionCallExpression<T>>(fn: (...params: any[]) => T, translate: (qb: IQueryBuilder, exp: TExp, param?: IQueryBuilderParameter) => string, isTranslate = (exp: TExp) => false) {
        let map = this._map.get(fn);
        if (!map) {
            map = {};
            this._map.set(fn, map);
        }
        let translateItem: IQueryTranslatorItem = {
            translate: translate,
            isTranslate: isTranslate
        };
        map[""] = translateItem;
    }
    public registerType<T, TExp extends IExpression<GenericType<T>>>(type: GenericType<T>, translate: (qb: IQueryBuilder, exp: TExp, param?: IQueryBuilderParameter) => string, isTranslate = (exp: TExp) => false) {
        let map = this._map.get(type);
        if (!map) {
            map = {};
            this._map.set(type, map);
        }
        let translateItem: IQueryTranslatorItem = {
            translate: translate,
            isTranslate: isTranslate
        };
        map[""] = translateItem;
    }
    public registerOperator<TExp extends IUnaryOperatorExpression | IBinaryOperatorExpression | TernaryExpression>(operator: IObjectType<TExp>, translate: (qb: IQueryBuilder, exp: TExp, param?: IQueryBuilderParameter) => string, isTranslate = (exp: TExp) => false) {
        let map = this._map.get(operator);
        if (!map) {
            map = {};
            this._map.set(operator, map);
        }
        let translateItem: IQueryTranslatorItem = {
            translate: translate,
            isTranslate: isTranslate
        };
        map[""] = translateItem;
    }
    public registerMember<T, K extends keyof T, TExp extends MemberAccessExpression<T, K>>(object: T, memberName: K, translate: (qb: IQueryBuilder, exp: TExp, param?: IQueryBuilderParameter) => string, isTranslate = (exp: TExp) => false) {
        let map = this._map.get(object);
        if (!map) {
            map = {};
            this._map.set(object, map);
        }
        let translateItem: IQueryTranslatorItem = {
            translate: translate,
            isTranslate: isTranslate
        };
        map[memberName] = translateItem;
    }
    public registerMethod<T, K extends keyof T, TExp extends MethodCallExpression<T, K>>(object: T, methodName: K, translate: (qb: IQueryBuilder, exp: TExp, param?: IQueryBuilderParameter) => string, isTranslate = (exp: TExp) => false) {
        let map = this._map.get(object);
        if (!map) {
            map = {};
            this._map.set(object, map);
        }
        let translateItem: IQueryTranslatorItem = {
            translate: translate,
            isTranslate: isTranslate
        };
        map[methodName] = translateItem;
    }

    public resolve(object: any, memberName?: string) {
        let map = this._map.get(object);
        let item = map && map[memberName || ""];
        if (item === undefined) {
            for (const fallback of this.fallbacks) {
                item = fallback.resolve(object, memberName);
                if (item)
                    break;
            }
        }
        return item;
    }
    protected fallbacks: QueryTranslator[] = [];
    public registerFallbacks(...fallbacks: QueryTranslator[]) {
        this.fallbacks = this.fallbacks.concat(fallbacks);
    }
}
