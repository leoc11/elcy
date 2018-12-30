import { IQueryTranslatorItem } from "./IQueryTranslatorItem";
import { FunctionCallExpression } from "../../ExpressionBuilder/Expression/FunctionCallExpression";
import { IUnaryOperatorExpression } from "../../ExpressionBuilder/Expression/IUnaryOperatorExpression";
import { IBinaryOperatorExpression } from "../../ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { TernaryExpression } from "../../ExpressionBuilder/Expression/TernaryExpression";
import { IMemberOperatorExpression } from "../../ExpressionBuilder/Expression/IMemberOperatorExpression";
import { QueryBuilder } from "../QueryBuilder";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { ValueType, IObjectType } from "../../Common/Type";

export class QueryTranslator {
    private _map = new Map<any, { [key: string]: IQueryTranslatorItem }>();
    constructor(public key: symbol) { }
    // Register Type Implementation
    public register<T extends ValueType>(type: T, translate: (exp: IExpression<T>, qb: QueryBuilder) => string, preferTranslate?: boolean | ((exp: IExpression<T>, isValidInApp: boolean) => boolean)): void;
    // Register Operator Implementation
    public register<T extends IUnaryOperatorExpression | IBinaryOperatorExpression | TernaryExpression>(operator: IObjectType<T>, translate: (exp: T, qb: QueryBuilder) => string, preferTranslate?: boolean | ((exp: IExpression, isValidInApp: boolean) => boolean)): void;
    // Register Function Implementation
    public register(fn: Function, translate: (exp: FunctionCallExpression, qb: QueryBuilder) => string, preferTranslate?: boolean | ((exp: IExpression, isValidInApp: boolean) => boolean)): void;
    // Register Member and Method Implementation
    public register<T>(object: T, memberName: keyof T, translate: (exp: IMemberOperatorExpression, qb: QueryBuilder) => string, preferTranslate?: boolean | ((exp: IExpression, isValidInApp: boolean) => boolean)): void;
    public register(object: any, translateOrMember: ((exp: IExpression, qb: QueryBuilder) => string) | string, translateOrPreferTranslate?: ((exp: IExpression, qb: QueryBuilder) => string) | boolean | ((exp: IExpression, isValidInApp: boolean) => boolean), preferTranslate: boolean | ((exp: IExpression, isValidInApp: boolean) => boolean) = false) {
        let translate: any;
        let memberName: string;

        if (typeof translateOrMember === "string") {
            memberName = translateOrMember;
            translate = translateOrPreferTranslate;
            preferTranslate = preferTranslate;
        }
        else {
            translate = translateOrMember;
            preferTranslate = translateOrPreferTranslate as any;
        }

        let map = this._map.get(object);
        if (!map) {
            map = {};
            this._map.set(object, map);
        }

        let translateItem: IQueryTranslatorItem;
        if (translate) {
            let isPreferTranslate: (exp: IExpression, isValidInApp: boolean) => boolean;
            if (preferTranslate instanceof Function) {
                isPreferTranslate = preferTranslate;
            }
            else if (preferTranslate) {
                isPreferTranslate = () => true;
            }
            else {
                isPreferTranslate = (exp: any, isValidInApp: boolean) => !isValidInApp;
            }
            translateItem = { translate: translate, isPreferTranslate: isPreferTranslate };
        }
        else {
            translateItem = null;
        }
        map[memberName || ""] = translateItem;
    }
    public resolve(object: any, memberName?: string) {
        let map = this._map.get(object);
        let item = map ? map[memberName || ""] : undefined;
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
