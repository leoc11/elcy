import { IQueryTranslatorItem } from "./IQueryTranslatorItem";
import { FunctionCallExpression } from "../../ExpressionBuilder/Expression/FunctionCallExpression";
import { IUnaryOperatorExpression } from "../../ExpressionBuilder/Expression/IUnaryOperatorExpression";
import { IBinaryOperatorExpression } from "../../ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { TernaryExpression } from "../../ExpressionBuilder/Expression/TernaryExpression";
import { IMemberOperatorExpression } from "../../ExpressionBuilder/Expression/IMemberOperatorExpression";
import { QueryBuilder } from "../QueryBuilder";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { GenericType } from "../../Common/Type";

export class QueryTranslator {
    constructor(public key: symbol) { }
    // Register Operator Implementation
    public register<T extends IUnaryOperatorExpression | IBinaryOperatorExpression | TernaryExpression>(operator: GenericType<T>, translate: (exp: T, qb: QueryBuilder) => string, preferApp?: boolean): void;
    // Register Function Implementation
    public register(fn: Function, translate: (exp: FunctionCallExpression, qb: QueryBuilder) => string, preferApp?: boolean): void;
    // Register Member and Method Implementation
    public register<T>(object: T, memberName: keyof T, translate: (exp: IMemberOperatorExpression, qb: QueryBuilder) => string, preferApp?: boolean): void;
    public register(object: any, translateOrMember: ((exp: IExpression, qb: QueryBuilder) => string) | string, translateOrpreferApp?: ((exp: IExpression, qb: QueryBuilder) => string) | boolean, preferApp?: boolean) {
        let translate: any;
        let memberName: string;
        if (typeof preferApp === "undefined") {
            preferApp = true;
        }

        if (typeof translateOrMember === "string") {
            memberName = translateOrMember;
        }
        else {
            translate = translateOrMember;
        }
        if (typeof translateOrpreferApp !== "undefined") {
            if (typeof translateOrpreferApp === "boolean") {
                preferApp = translateOrpreferApp;
            }
            else {
                translate = translateOrpreferApp;
            }
        }

        if (memberName) {
            Reflect.defineMetadata(this.key, { translate: translate, preferApp: preferApp }, object, memberName);
        }
        else {
            Reflect.defineMetadata(this.key, { translate: translate, preferApp: preferApp }, object);
        }
    }
    public resolve(object: any, memberName?: string) {
        let item: IQueryTranslatorItem = memberName ? Reflect.getOwnMetadata(this.key, object, memberName) : Reflect.getOwnMetadata(this.key, object);
        return item;
    }
}
