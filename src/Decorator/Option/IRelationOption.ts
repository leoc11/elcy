import { IObjectType, ReferenceOption, RelationshipType } from "../../Common/Type";

export interface IRelationOption<TSource, TTarget> extends IAdditionalRelationOption {
    sourceType?: IObjectType<TSource>;
    targetType: IObjectType<TTarget>;
    relationKeys?: Array<keyof TSource | ((source: TSource) => any)>;
    name?: string;
    // used for sql foreign key constraint name
    relationKeyName?: string;
    relationType: RelationshipType | "one?";
    propertyName?: keyof TSource;
}
export interface IAdditionalRelationOption {
    nullable?: boolean;
    updateOption?: ReferenceOption;
    deleteOption?: ReferenceOption;
}
