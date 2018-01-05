import { IObjectType } from "../Common/Type";
import { DbContext } from "./DBContext";
import { NamingStrategy } from "./NamingStrategy";
import { Queryable } from "./Queryable";

export class DbSet<T> extends Queryable<T> {
    /**
     * Naming strategy to be used to name tables and columns in the database.
     */
    public readonly namingStrategy: NamingStrategy;

    constructor(public readonly type: IObjectType<T>, private readonly context: DbContext) {
        super(type, context.queryBuilder);
    }

    public update(setter: {[key in keyof T]: T[key]}, predicate?: (item: T) => boolean): number {
        return 0;
    }

    public delete(predicate: (item: T) => boolean, isHardDelete = false): number {
        return 0;
    }
}
