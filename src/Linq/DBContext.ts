import { IObjectType } from "../Common/Type";
// import { Connection } from "./Connection";
import { DbSet } from "./DbSet";
import { QueryBuilder } from "./QueryBuilder";

export abstract class DbContext {
    public readonly database: string;
    public abstract readonly entities: Array<IObjectType<any>>;
    public abstract readonly queryBuilder: IObjectType<QueryBuilder>;
    // private connection: Connection;
    constructor(connectionOption: IConnectionOption) {
        // this.connection = new Connection(connectionOption);
    }

    public set<T>(type: IObjectType<T>): DbSet<T> {
        return new DbSet(type, this);
    }
}
