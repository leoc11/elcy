import { IObjectType } from "../../Common/Type";
import { IRelationMetaData } from "./IRelationMetaData";

export interface IChangeEventParam {
    property: string;
    oldValue: any;
    newValue: any;
}
export type RelationChangeType = "add" | "del";
export interface IRelationChangeEventParam {
    relation: IRelationMetaData;
    type: RelationChangeType;
    entities: any[];
}