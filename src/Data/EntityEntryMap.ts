import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { EntityEntry } from "./EntityEntry";

export class EntityEntryMap implements Iterable<[IEntityMetaData, EntityEntry[]]> {
    public [Symbol.iterator]() {
        return (this.map as Map<IEntityMetaData, EntityEntry[]>)[Symbol.iterator]();
    }

    private map: Map<object, object[]> = new Map();
    public get<T extends object>(entityMeta: IEntityMetaData<T>): EntityEntry<T>[] | undefined {
        return this.map.get(entityMeta) as EntityEntry<T>[] | undefined;
    }
    public clear() {
        this.map.clear();
    }
    public has<T extends object>(entityMeta: IEntityMetaData<T>) {
        return this.map.has(entityMeta);
    }
    public set<T extends object>(entityMeta: IEntityMetaData<T>, entry: EntityEntry<T>[]) {
        this.map.set(entityMeta, entry);
        return this;
    }
}
