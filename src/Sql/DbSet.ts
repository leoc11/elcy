import { IObjectType } from "../Common/Type";
import { Queryable } from "../Linq/Queryable";
import { DbContext } from "./DBContext";
import { NamingStrategy } from "./NamingStrategy";
import { QueryBuilder } from "./QueryBuilder";

export class DbSet<T> extends Queryable<T> {
    public readonly queryBuilder: QueryBuilder;
    /**
     * Naming strategy to be used to name tables and columns in the database.
     */
    public readonly namingStrategy: NamingStrategy;

    constructor(public readonly type: IObjectType<T>, private readonly context: DbContext) {
        super(type, type.name);
    }
}
