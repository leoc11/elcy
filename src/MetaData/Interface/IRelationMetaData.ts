import { genericType, ReferenceOption, RelationType } from "../Types";

export interface IRelationMetaData<TSource, TTarget, TSourceKey extends keyof TSource, TTargetKey extends keyof TTarget> {
    sourceType?: genericType<TSource>;
    targetType?: genericType<TTarget>;
    relationMaps?: Array<{ source: TSourceKey, target: TTargetKey }>;
    relationType?: RelationType;
    foreignKeyName?: string;
    deleteOption: ReferenceOption;
    updateOption: ReferenceOption;
}
