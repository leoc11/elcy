import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { EmbeddedEntityEntry } from "./EmbeddedEntityEntry";

export class EmbeddedEntityEntryMap implements Iterable<[IEntityMetaData, EmbeddedEntityEntry[]]> {
    public [Symbol.iterator]() {
        return (this.map as Map<IEntityMetaData, EmbeddedEntityEntry[]>)[Symbol.iterator]();
    }

    private map: Map<object, object[]> = new Map();
    public get<T extends object>(entityMeta: IEntityMetaData<T>): EmbeddedEntityEntry<T, any>[] | undefined {
        return this.map.get(entityMeta) as EmbeddedEntityEntry<T, any>[] | undefined;
    }
    public clear() {
        this.map.clear();
    }
    public has<T extends object>(entityMeta: IEntityMetaData<T>) {
        return this.map.has(entityMeta);
    }
    public set<T extends object>(entityMeta: IEntityMetaData<T>, entry: EmbeddedEntityEntry<T, any>[]) {
        this.map.set(entityMeta, entry);
        return this;
    }
}
