import { InstantiationExpression } from "src/ExpressionBuilder/Expression/InstantiationExpression";
import { DbValue, GenericType, IObjectType, MethodKey, PrimitiveType, StringKeyOf, ValueType } from "../Common/Type";
import { FunctionCallExpression } from "../ExpressionBuilder/Expression/FunctionCallExpression";
import { IBinaryOperatorExpression } from "../ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { IUnaryOperatorExpression } from "../ExpressionBuilder/Expression/IUnaryOperatorExpression";
import { MemberAccessExpression } from "../ExpressionBuilder/Expression/MemberAccessExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { TernaryExpression } from "../ExpressionBuilder/Expression/TernaryExpression";
import { IQueryBuilder } from "./IQueryBuilder";
import { IQueryBuilderContext } from "./IQueryBuilderContext";
import { IQueryTranslatorItem } from "./IQueryTranslatorItem";
import { IMultiOperatorExpression } from "src/ExpressionBuilder/Expression/IMultiOperatorExpression";
import { ICompleteColumnType } from "src/Common/ICompleteColumnType";
import { registerValueType } from "src/Helper/Util";
import { IColumnMetaData } from "src/MetaData/Interface/IColumnMetaData";

type ValueTypeConfig<T extends ValueType = any> = {
    hydrate(value: DbValue): T;
    persist(value: T): DbValue;
    toQueryValue(value: T): string;
    columnType: ICompleteColumnType;
};
type ColumnTypeConfig<T = any> = {
    hydrate(value: DbValue, meta: IColumnMetaData<any, T>, t: QueryTranslator): T;
    persist(value: T, meta: IColumnMetaData<any, T>, t: QueryTranslator): DbValue;
    columnType: ICompleteColumnType;
};

export class QueryTranslator {
    constructor(public key: symbol) { }
    protected fallbacks: QueryTranslator[] = [];
    private _map = new Map<any, { [key: string]: IQueryTranslatorItem }>();

    private _valueTypeConfig = new Map<GenericType, ValueTypeConfig>();
    private _columnTypeConfig = new Map<GenericType<IColumnMetaData<any, any, any>>, ColumnTypeConfig>();

    public registerFallbacks(...fallbacks: QueryTranslator[]) {
        this.fallbacks.push(...fallbacks);
    }
    public registerFn<T, TExp extends FunctionCallExpression<T>>(fn: (...params: unknown[]) => T, translate: (qb: IQueryBuilder, exp: TExp, context?: IQueryBuilderContext) => string, isTranslate = (exp: TExp) => false) {
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
    public registerMember<TE extends object, K extends StringKeyOf<TE>, TExp extends MemberAccessExpression<TE, K>>(object: TE, memberName: K, translate: (qb: IQueryBuilder, exp: TExp, context?: IQueryBuilderContext) => string, isTranslate = (exp: TExp) => false) {
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
    public registerMethod<TE, K extends MethodKey<TE>, TExp extends MethodCallExpression<TE, K>>(object: TE, methodName: K, translate: (qb: IQueryBuilder, exp: TExp, context?: IQueryBuilderContext) => string, isTranslate = (exp: TExp) => false) {
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
    public registerOperator<TExp extends IUnaryOperatorExpression | IBinaryOperatorExpression | IMultiOperatorExpression | TernaryExpression>(operator: IObjectType<TExp>, translate: (qb: IQueryBuilder, exp: TExp, context?: IQueryBuilderContext) => string, isTranslate = (exp: TExp) => false) {
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
    public registerConstructor<T, TExp extends InstantiationExpression<T>>(type: PrimitiveType<T>, translate: (qb: IQueryBuilder, exp: TExp, context?: IQueryBuilderContext) => string, isTranslate?: (exp: TExp) => boolean): void;
    public registerConstructor<T, TExp extends InstantiationExpression<T>>(type: GenericType<T>, translate: (qb: IQueryBuilder, exp: TExp, context?: IQueryBuilderContext) => string, isTranslate?: (exp: TExp) => boolean): void;
    public registerConstructor<T, TExp extends InstantiationExpression<T>>(type: GenericType<T>, translate: (qb: IQueryBuilder, exp: TExp, context?: IQueryBuilderContext) => string, isTranslate: (exp: TExp) => boolean = (exp: TExp) => false) {
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
        if (!item?.translate) {
            for (const fallback of this.fallbacks) {
                item = fallback.resolve(object, memberName);
                if (item) {
                    break;
                }
            }
        }
        return item;
    }

    public resolveValueType<T extends ValueType>(type: GenericType<T>): ValueTypeConfig<T> {
        let config = this._valueTypeConfig.get(type);
        if (config === undefined) {
            for (const fallback of this.fallbacks) {
                config = fallback.resolveValueType(type);
                if (config) {
                    break;
                }
            }
        }

        return config;
    }
    public registerValueType<T extends ValueType>(type: PrimitiveType<T>, columnType?: ICompleteColumnType, hydrate?: (value: DbValue) => T, persist?: (value: T) => DbValue, queryValue?: (value: T) => string): void;
    public registerValueType<T extends ValueType>(type: IObjectType<T>, columnType?: ICompleteColumnType, hydrate?: (value: DbValue) => T, persist?: (value: T) => DbValue, queryValue?: (value: T) => string): void;
    public registerValueType<T extends ValueType>(type: GenericType<T>, columnType?: ICompleteColumnType, hydrate?: (value: DbValue) => T, persist?: (value: T) => DbValue, queryValue?: (value: T) => string) {
        const baseConfig = this.resolveValueType(type);
        let config: ValueTypeConfig<T> = {
            columnType: columnType ?? baseConfig?.columnType,
            toQueryValue: queryValue ?? baseConfig?.toQueryValue ?? ((value: T) => `'${value?.toString().replace(/'/ig, "''")}'`),
            persist: persist ?? baseConfig?.persist ?? ((value: T) => String(value)),
            hydrate: hydrate ?? baseConfig?.hydrate ?? ((value: DbValue) => value as T)
        };

        if (!config.columnType || !config.persist || !config.toQueryValue) {
            throw "missing parameter";
        }

        registerValueType(type);
        this._valueTypeConfig.set(type, config);
    }

    public resolveColumnType<T>(columnMeta: IObjectType<IColumnMetaData<any, T>>): ColumnTypeConfig<T> {
        let config = this._columnTypeConfig.get(columnMeta);
        if (config === undefined) {
            for (const fallback of this.fallbacks) {
                config = fallback.resolveColumnType(columnMeta);
                if (config) {
                    break;
                }
            }
        }

        return config;
    }

    public registerColumnType<TMeta extends IColumnMetaData<any, any, any>, T extends (TMeta extends IColumnMetaData<any, infer U, any> ? U : never) = (TMeta extends IColumnMetaData<any, infer U, any> ? U : never)>(columnMeta: IObjectType<TMeta>, columnType?: ICompleteColumnType, hydrate?: (value: DbValue, meta: TMeta, t: QueryTranslator) => T, persist?: (value: T, meta: TMeta, t: QueryTranslator) => DbValue) {
        const baseConfig = this.resolveColumnType(columnMeta);
        let config: ColumnTypeConfig<T> = {
            columnType: columnType ?? baseConfig?.columnType,
            hydrate: hydrate ?? baseConfig?.hydrate ?? ((value, meta, t) => t.resolveValueType(meta.type).hydrate(value)),
            persist: persist ?? baseConfig?.persist ?? ((value, meta, t) => t.resolveValueType(meta.type).persist(value))
        };

        if (!config.columnType || !config.hydrate || !config.persist) {
            throw "missing parameter";
        }

        this._columnTypeConfig.set(columnMeta, config);
    }
}
