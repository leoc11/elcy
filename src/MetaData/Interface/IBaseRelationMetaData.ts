import { RelationshipType } from "../../Common/Type";
import { IEntityMetaData } from "./IEntityMetaData";

export interface IBaseRelationMetaData<TSource = any, TTarget = any> {
    propertyName?: keyof TSource;
    source: IEntityMetaData<TSource>;
    target: IEntityMetaData<TTarget>;
    nullable?: boolean;
    relationType: RelationshipType;
}
