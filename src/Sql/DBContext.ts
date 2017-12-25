import { IObjectType } from "../Common/Type";
import { Connection } from "./Connection";
import { NamingStrategy } from "./NamingStrategy";
import { QueryBuilder } from "./QueryBuilder";
import { DbSet } from "./DbSet";

export abstract class DbContext {
    public readonly database: string;
    public readonly entities?: IObjectType<any>;
    public readonly queryBuilder: QueryBuilder;
    /**
     * Naming strategy to be used to name tables and columns in the database.
     */
    public readonly namingStrategy: NamingStrategy;
    private connection: Connection;
    private dbsets: { [key: string]: DbSet<any> } = {}; // don't only used constructor name but also namespace if possible
    constructor(connectionOption: IConnectionOption) {
        this.connection = new Connection(connectionOption);
    }

    public Set<T>(type: IObjectType<T>): DbSet<T> {
        let dbSet: DbSet<T> = this.dbsets[type.name];
        if (!dbSet) {
            dbSet = new DbSet(type, this);
        }

        return dbSet;
    }
}
