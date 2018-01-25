import { IObjectType } from "../Common/Type";
// import { Connection } from "./Connection";
import { DbSet } from "./DbSet";
import { QueryBuilder } from "./QueryBuilder";

export abstract class DbContext {
    public readonly database: string;
    public abstract readonly entities: Array<IObjectType<any>>;
    public abstract readonly queryBuilder: IObjectType<QueryBuilder>;
    // private connection: Connection;
    private dbsets: { [key: string]: DbSet<any> } = {}; // don't only used constructor name but also namespace if possible
    constructor(connectionOption: IConnectionOption) {
        // this.connection = new Connection(connectionOption);
    }

    public set<T>(type: IObjectType<T>): DbSet<T> {
        let dbSet = this.dbsets[type.name!];
        if (!dbSet) {
            dbSet = this.dbsets[type.name!] = new DbSet(type, this);
        }

        return dbSet;
    }
}
