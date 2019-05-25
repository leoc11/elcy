import { IColumnMetaData } from "./IColumnMetaData";
import { IRelationMetaData } from "./IRelationMetaData";

export interface IChangeEventParam<TE = any, T = any> {
    column: IColumnMetaData<TE, T>;
    newValue: T;
    oldValue: T;
}
export type RelationChangeType = "add" | "del";
export interface IRelationChangeEventParam {
    entities: any[];
    relation: IRelationMetaData;
    type: RelationChangeType;
}
