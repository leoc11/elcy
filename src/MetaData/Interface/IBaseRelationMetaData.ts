import { RelationshipType } from "../../Common/StringType";
import { IEntityMetaData } from "./IEntityMetaData";

export interface IBaseRelationMetaData<TSource extends object = object, TTarget extends object = object> {
    nullable?: boolean;
    propertyName?: keyof TSource;
    relationType: RelationshipType;
    source: IEntityMetaData<TSource>;
    target: IEntityMetaData<TTarget>;
}
