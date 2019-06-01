import { IColumnMetaData } from "./IColumnMetaData";
import { IRelationMetaData } from "./IRelationMetaData";

export interface IChangeEventParam<TE = any, T = any> {
    column: IColumnMetaData<TE, T>;
    newValue: T;
    oldValue: T;
}
export type RelationChangeType = "add" | "del";
export interface IRelationChangeEventParam<TM = any, TS = any> {
    entities: TS[];
    relation: IRelationMetaData<TM, TS>;
    type: RelationChangeType;
}
