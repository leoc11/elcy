import { IObjectType } from "../Common/Type";
import { DbContext } from "./DBContext";
import { NamingStrategy } from "./NamingStrategy";
import { Queryable } from "./Queryable";
import { EntityExpression, SelectExpression } from "./Queryable/QueryExpression/index";

export class DbSet<T> extends Queryable<T> {
    /**
     * Naming strategy to be used to name tables and columns in the database.
     */
    public readonly namingStrategy: NamingStrategy;

    constructor(public readonly type: IObjectType<T>, context: DbContext) {
        super(type, new context.queryBuilder());
        this.expression = new SelectExpression(new EntityExpression(type, this.queryBuilder.newAlias()));
    }

    // public update(setter: {[key in keyof T]: T[key]}, predicate?: (item: T) => boolean): number {
    //     return 0;
    // }

    // public delete(predicate: (item: T) => boolean, isHardDelete = false): number {
    //     return 0;
    // }
}
