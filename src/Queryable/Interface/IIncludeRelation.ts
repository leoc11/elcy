import { ISelectRelation } from "./ISelectRelation";
import { RelationshipType } from "../../Common/Type";

export interface IIncludeRelation<T = any, TChild = any> extends ISelectRelation<T, TChild> {
    type: RelationshipType;
    name: string;
}