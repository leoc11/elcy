import { InstantiationExpression } from "src/ExpressionBuilder/Expression/InstantiationExpression";
import { GenericType, IObjectType, MethodKey, StringKeyOf } from "../Common/Type";
import { FunctionCallExpression } from "../ExpressionBuilder/Expression/FunctionCallExpression";
import { IBinaryOperatorExpression } from "../ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { IUnaryOperatorExpression } from "../ExpressionBuilder/Expression/IUnaryOperatorExpression";
import { MemberAccessExpression } from "../ExpressionBuilder/Expression/MemberAccessExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { TernaryExpression } from "../ExpressionBuilder/Expression/TernaryExpression";
import { IQueryBuilder } from "./IQueryBuilder";
import { IQueryBuilderParameter } from "./IQueryBuilderParameter";
import { IQueryTranslatorItem } from "./IQueryTranslatorItem";

export class QueryTranslator {
    constructor(public key: symbol) { }
    protected fallbacks: QueryTranslator[] = [];
    private _map = new Map<any, { [key: string]: IQueryTranslatorItem }>();
    public registerFallbacks(...fallbacks: QueryTranslator[]) {
        this.fallbacks.push(...fallbacks);
    }
    public registerFn<T, TExp extends FunctionCallExpression<T>>(fn: (...params: unknown[]) => T, translate: (qb: IQueryBuilder, exp: TExp, param?: IQueryBuilderParameter) => string, isTranslate = (exp: TExp) => false) {
        let map = this._map.get(fn);
        if (!map) {
            map = {};
            this._map.set(fn, map);
        }
        const translateItem: IQueryTranslatorItem = {
            translate: translate,
            isTranslate: isTranslate
        };
        map[""] = translateItem;
    }
    public registerMember<TE extends object, K extends StringKeyOf<TE>, TExp extends MemberAccessExpression<TE, K>>(object: TE, memberName: K, translate: (qb: IQueryBuilder, exp: TExp, param?: IQueryBuilderParameter) => string, isTranslate = (exp: TExp) => false) {
        let map = this._map.get(object);
        if (!map) {
            map = {};
            this._map.set(object, map);
        }
        const translateItem: IQueryTranslatorItem = {
            translate: translate,
            isTranslate: isTranslate
        };
        map[memberName] = translateItem;
    }
    public registerMethod<TE, K extends MethodKey<TE>, TExp extends MethodCallExpression<TE, K>>(object: TE, methodName: K, translate: (qb: IQueryBuilder, exp: TExp, param?: IQueryBuilderParameter) => string, isTranslate = (exp: TExp) => false) {
        let map = this._map.get(object);
        if (!map) {
            map = {};
            this._map.set(object, map);
        }
        const translateItem: IQueryTranslatorItem = {
            translate: translate,
            isTranslate: isTranslate
        };
        map[methodName] = translateItem;
    }
    public registerOperator<TExp extends IUnaryOperatorExpression | IBinaryOperatorExpression | TernaryExpression>(operator: IObjectType<TExp>, translate: (qb: IQueryBuilder, exp: TExp, param?: IQueryBuilderParameter) => string, isTranslate = (exp: TExp) => false) {
        let map = this._map.get(operator);
        if (!map) {
            map = {};
            this._map.set(operator, map);
        }
        const translateItem: IQueryTranslatorItem = {
            translate: translate,
            isTranslate: isTranslate
        };
        map[""] = translateItem;
    }
    public registerConstructor<T, TExp extends InstantiationExpression<T>>(type: GenericType<T>, translate: (qb: IQueryBuilder, exp: TExp, param?: IQueryBuilderParameter) => string, isTranslate = (exp: TExp) => false) {
        let map = this._map.get(type);
        if (!map) {
            map = {};
            this._map.set(type, map);
        }
        const translateItem: IQueryTranslatorItem = {
            translate: translate,
            isTranslate: isTranslate
        };
        map[""] = translateItem;
    }

    public resolve(object: any, memberName?: string) {
        const map = this._map.get(object);
        let item = map && map[memberName || ""];
        if (item === undefined) {
            for (const fallback of this.fallbacks) {
                item = fallback.resolve(object, memberName);
                if (item) {
                    break;
                }
            }
        }
        return item;
    }
}
