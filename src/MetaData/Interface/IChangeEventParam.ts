import { IColumnMetaData } from "./IColumnMetaData";
import { IRelationMetaData } from "./IRelationMetaData";

export interface IChangeEventParam<TE = unknown, T = unknown> {
    column: IColumnMetaData<TE, T>;
    newValue: T;
    oldValue: T;
}
export type RelationChangeType = "add" | "del";
export interface IRelationChangeEventParam<TM = unknown, TS = unknown> {
    entities: TS[];
    relation: IRelationMetaData<TM, TS>;
    type: RelationChangeType;
}
