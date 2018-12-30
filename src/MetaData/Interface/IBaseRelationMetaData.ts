import { IEntityMetaData } from "./IEntityMetaData";
import { RelationshipType } from "../../Common/Type";

export interface IBaseRelationMetaData<TSource = any, TTarget = any> {
    propertyName?: keyof TSource;
    source: IEntityMetaData<TSource>;
    target: IEntityMetaData<TTarget>;
    nullable?: boolean;
    relationType: RelationshipType;
}
