import { IObjectType } from "../Common/Type";
// import { Connection } from "./Connection";
import { DbSet } from "./DbSet";
import { QueryBuilder } from "./QueryBuilder";
import { EntityBase } from "../Data/EntityBase";

export abstract class DbContext {
    public abstract readonly database: string;
    public abstract readonly entityTypes: Array<IObjectType<any>>;
    public abstract readonly queryBuilder: IObjectType<QueryBuilder>;
    protected cachedDbSets: Map<IObjectType, DbSet<any>> = new Map();
    // private connection: Connection;
    constructor(connectionOption: IConnectionOption) {
        // this.connection = new Connection(connectionOption);
    }
    public set<T extends EntityBase>(type: IObjectType<T>, isClearCache = false): DbSet<T> {
        let result: DbSet<T> = isClearCache ? undefined as any : this.cachedDbSets.get(type);
        if (!result && this.entityTypes.contains(type)) {
            result = new DbSet(type, this);
            this.cachedDbSets.set(type, result);
        }
        return result;
    }
    public addedEntities: any[];
    public removedEntities: any[];
    public modifedEntities: any[];
}
