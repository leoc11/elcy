import { IColumnMetaData } from "./IColumnMetaData";
import { IRelationMetaData } from "./IRelationMetaData";

export interface IChangeEventParam<TE extends object = object, T = unknown> {
    column: IColumnMetaData<TE, T>;
    newValue: T;
    oldValue: T;
}
export type RelationChangeType = "add" | "del";
export interface IRelationChangeEventParam<TM extends object = object, TS extends object = object> {
    entities: TS[];
    relation: IRelationMetaData<TM, TS>;
    type: RelationChangeType;
}
