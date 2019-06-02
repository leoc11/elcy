import { RelationshipType } from "../../Common/StringType";
import { IEntityMetaData } from "./IEntityMetaData";

export interface IBaseRelationMetaData<TSource = any, TTarget = any> {
    nullable?: boolean;
    propertyName?: keyof TSource;
    relationType: RelationshipType;
    source: IEntityMetaData<TSource>;
    target: IEntityMetaData<TTarget>;
}
