import { IObjectType, orderDirection, genericType } from "../Common/Type";
import { AndExpression, FunctionExpression, MemberAccessExpression, MethodCallExpression, ValueExpression } from "../ExpressionBuilder/Expression";
import { ExpressionFactory } from "../ExpressionBuilder/ExpressionFactory";
import "./EnumerableExtension";
import { GroupQueryable } from "./GroupQueryable";
import { IColumnQueryExpression } from "./Interface/IColumnQueryExpression";
import { IEntityQueryExpression } from "./Interface/IEntityQueryExpression";
import { SelectQueryExpression } from "./SelectQueryExpression";

export class Queryable<T> {
    protected selectExpression: SelectQueryExpression<T>;
    protected type: IObjectType<T>;
    constructor(type: IObjectType<T>, alias = "") {
        // super(); no more extends for array. to many issue.
        this.type = type;
        this.selectExpression = new SelectQueryExpression(type, alias);
    }

    public select2(...properties: Array<string | ((item: T) => any)>): Queryable<T>;
    public select2<TReturn extends {[key in keyof T]: any}>(fn: (item: T) => TReturn, type: IObjectType<TReturn>): Queryable<TReturn>;
    public select2<TReturn>(fn: ((item: T) => TReturn | any) | string, type?: IObjectType<TReturn> | string | ((item: T) => any), ...properties: Array<string | ((item: T) => any)>): Queryable<TReturn> | Queryable<T> {
        if (type && (type as IObjectType<TReturn>).prototype) {
            const literalObjectExpression = ExpressionFactory.prototype.ToLiteralObjectExpression(fn as ((item: T) => TReturn), this.type);
            const result = new Queryable(type as IObjectType<TReturn>);

            // tslint:disable-next-line:forin
            for (const prop in literalObjectExpression) {
                this.selectExpression.columns.add({
                    alias: prop,
                    entity: this.selectExpression,
                    property: literalObjectExpression[prop]
                });
            }

            return result;
        }
        else {
            properties.add(fn);
            if (type)
                properties.add(type as string | ((item: T) => any));

            for (const prop of properties) {
                const item: IColumnQueryExpression<T> = {
                    alias: "",
                    entity: this.selectExpression as IEntityQueryExpression<T>,
                    property: typeof prop === "string" ? prop : ExpressionFactory.prototype.ToExpression<T, any, any>(prop, this.type)
                };
                this.selectExpression.columns.add(item);
            }
            return this;
        }
    }

    // public selectMany<TReturn>(fn: (item: T) => TReturn[], type: IObjectType<TReturn>): Queryable<TReturn> {
    //     const expression = ExpressionFactory.prototype.ToExpression(fn, this.type);
    //     let objExpression = expression.Body;
    //     const result = new Queryable<TReturn>(type, "");
    //     let isMet = true;
    //     while (isMet) {
    //         if (objExpression instanceof MethodCallExpression) {
    //             switch (objExpression.MethodName) {
    //                 case "orderBy":
    //                     result.orderBy(objExpression.Params[0] as FunctionExpression<TReturn, any>, (objExpression.Params[1] as ValueExpression<orderDirection>).Execute());
    //                     break;
    //                 case "where":
    //                     result.where(objExpression.Params[0] as FunctionExpression<TReturn, boolean>);
    //                     break;
    //                 case "take":
    //                     result.take((objExpression.Params[0] as ValueExpression<number>).Execute());
    //                     break;
    //                 case "skip":
    //                     result.skip((objExpression.Params[0] as ValueExpression<number>).Execute());
    //                     break;
    //                 // TODO: implement inner select/selectmany/groupby... function call.
    //                 case "select":
    //                 case "selectMany":
    //                 case "groupBy":
    //                 default:
    //                     throw new Error("Not Implementd");
    //             }
    //             objExpression = objExpression.ObjectOperand;
    //         }
    //         else if (objExpression instanceof MemberAccessExpression) {
    //             objExpression = objExpression.ObjectOperand;
    //             isMet = false;
    //         }
    //     }
    //     return result;
    // }
    public where(fn: ((item: T) => boolean) | FunctionExpression<T, boolean>): Queryable<T> {
        let whereExp = fn instanceof FunctionExpression ? fn : ExpressionFactory.prototype.ToExpression(fn, this.type);
        if (this.where) {
            whereExp = FunctionExpression.Create(AndExpression.Create(this.selectExpression.where!.Body, whereExp.Body), this.selectExpression.where!.Params);
        }
        this.selectExpression.where = whereExp;
        return this;
    }
    public orderBy(fn: ((item: T) => any) | FunctionExpression<T, any>, direction: orderDirection): Queryable<T> {
        const orderExp = fn instanceof FunctionExpression ? fn : ExpressionFactory.prototype.ToExpression(fn, this.type);
        this.selectExpression.orderBy.add({
            direction,
            entity: this.selectExpression,
            property: orderExp
        });
        return this;
    }
    public skip(n: number): Queryable<T> {
        this.selectExpression.pagging.skip = n;
        return this;
    }
    public take(n: number): Queryable<T> {
        this.selectExpression.pagging.take = n;
        return this;
    }
    // public groupBy<KType>(fn: (item: T) => KType, keyType: genericType<KType>): GroupQueryable<T, KType> {
    //     return new GroupQueryable(this.type, keyType, "");
    // }
    // public distinct<TKey>(fn?: (item: T) => TKey): Queryable<T> {
    //     if (fn)
    //         return this.groupBy(fn).first();

    //     this.selectExpression.distinct = true;
    // }
    public contains(item: T): boolean {
        return true;
    }
    public first(fn?: (item: T) => boolean): T {
        return this as any;
    }
    public last(fn?: (item: T) => boolean): T {
        return this as any;
    }
    public any(fn?: (item: T) => boolean): boolean {
        return true;
    }
    public all(fn?: (item: T) => boolean): boolean {
        return true;
    }
    public sum(fn?: (item: T) => number): number {
        return 0;
    }
    public count(): number {
        return 0;
    }
    public avg(fn?: (item: T) => number): number {
        return 0;
    }
    public max(fn?: (item: T) => number): number {
        return 0;
    }
    public min(fn?: (item: T) => number): number {
        return 0;
    }
}
