import { IRelationMetaData } from "../MetaData/Interface/IRelationMetaData";
import { RelationEntry } from "./RelationEntry";

export class RelationEntryMap implements Iterable<[IRelationMetaData, RelationEntry[]]> {
    private map: Map<object, object[]> = new Map();
    public get<T1 extends object, T2 extends object>(entityMeta: IRelationMetaData<T1, T2>): RelationEntry<T1, T2>[] | undefined {
        return this.map.get(entityMeta) as RelationEntry<T1, T2>[] | undefined;
    }
    public clear() {
        this.map.clear();
    }
    public has<T1 extends object, T2 extends object>(entityMeta: IRelationMetaData<T1, T2>) {
        return this.map.has(entityMeta);
    }
    public set<T1 extends object, T2 extends object>(entityMeta: IRelationMetaData<T1, T2>, entry: RelationEntry<T1, T2>[]) {
        this.map.set(entityMeta, entry);
        return this;
    }
    public [Symbol.iterator]() {
        return (this.map as Map<IRelationMetaData, RelationEntry[]>)[Symbol.iterator]();
    }
    public get size() {
        return this.map.size;
    }
}
