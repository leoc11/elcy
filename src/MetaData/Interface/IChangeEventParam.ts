import { IColumnMetaData } from "./IColumnMetaData";
import { IRelationMetaData } from "./IRelationMetaData";

export interface IChangeEventParam<TE = any, T = any> {
    column: IColumnMetaData<TE, T>;
    oldValue: T;
    newValue: T;
}
export type RelationChangeType = "add" | "del";
export interface IRelationChangeEventParam {
    relation: IRelationMetaData;
    type: RelationChangeType;
    entities: any[];
}
