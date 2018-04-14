import { IObjectType, RelationType } from "../../Common/Type";

export interface IRelationMetaData<TSource, TTarget> {
    sourceType?: IObjectType<TSource>;
    targetType?: IObjectType<TTarget>;
    relationType?: RelationType;
    foreignKeyName?: string;
    relationMaps?: Map<keyof TSource, keyof TTarget>;
    reverseProperty?: string;
}
