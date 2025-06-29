import { GenericType, IObjectType, MethodKey, StringKeyOf } from "../Common/Type";
import { FunctionCallExpression } from "../ExpressionBuilder/Expression/FunctionCallExpression";
import { IBinaryOperatorExpression } from "../ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { InstantiationExpression } from "../ExpressionBuilder/Expression/InstantiationExpression";
import { IUnaryOperatorExpression } from "../ExpressionBuilder/Expression/IUnaryOperatorExpression";
import { MemberAccessExpression } from "../ExpressionBuilder/Expression/MemberAccessExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { TernaryExpression } from "../ExpressionBuilder/Expression/TernaryExpression";
import { IQueryBuilder } from "./IQueryBuilder";
import { IQueryBuilderParameter } from "./IQueryBuilderParameter";
import { IQueryTranslatorItem } from "./IQueryTranslatorItem";

export class QueryTranslator {
    constructor(public key: symbol) { }
    protected fallbacks: QueryTranslator;
    private _map = new Map<any, { [key: string]: IQueryTranslatorItem }>();
    public extends(base: QueryTranslator) {
        if (this._map.size > 0) {
            throw new Error("Cannot extends filled translator");
        }

        this._map = new Map(base._map);
    }
    public registerFn<T, TExp extends FunctionCallExpression<T>>(fn: (...params: any[]) => T, translate: (qb: IQueryBuilder, exp: TExp, param?: IQueryBuilderParameter) => string, isTranslate = (exp: TExp) => false) {
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
    public registerMember<T extends object, K extends StringKeyOf<T>, TExp extends MemberAccessExpression<T, K>>(object: T, memberName: K, translate: (qb: IQueryBuilder, exp: TExp, param?: IQueryBuilderParameter) => string, isTranslate = (exp: TExp) => false) {
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
    public registerMethod<T, K extends MethodKey<T>, TExp extends MethodCallExpression<T, K>>(object: T, methodName: K, translate: (qb: IQueryBuilder, exp: TExp, param?: IQueryBuilderParameter) => string, isTranslate = (exp: TExp) => false) {
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
    public registerType<T, TExp extends InstantiationExpression<T>>(type: GenericType<T>, translate: (qb: IQueryBuilder, exp: TExp, param?: IQueryBuilderParameter) => string, isTranslate = (exp: TExp) => false) {
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
        return item;
    }
}
