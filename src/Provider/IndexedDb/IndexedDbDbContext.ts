import { IObjectType } from "../../Common/Type";
import { DbContext } from "../../Data/DbContext";
import { DbSet } from "../../Data/DbSet";

export abstract class IndexedDbDbContext extends DbContext {
    public set<T>(type: IObjectType<T>, isClearCache = false): DbSet<T> {
        let result: DbSet<T>;
        if (!isClearCache) {
            result = this._cachedDbSets.get(type);
        }
        if (!result && this.entityTypes.contains(type)) {
            result = new DbSet(type, this);
            this._cachedDbSets.set(type, result);
        }
        return result;
    }
}
