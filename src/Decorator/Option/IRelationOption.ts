import { ReferenceOption, RelationshipType } from "../../Common/StringType";
import { IObjectType, StringKeyOf } from "../../Common/Type";

export interface IRelationOption<TSource, TTarget> extends IAdditionalRelationOption {
    name?: string;
    propertyName?: StringKeyOf<TSource>;
    // used for sql foreign key constraint name
    relationKeyName?: string;
    relationKeys?: Array<StringKeyOf<TSource> | ((source: TSource) => any)>;
    relationType: RelationshipType | "one?";
    sourceType?: IObjectType<TSource>;
    targetType: IObjectType<TTarget>;
}
export interface IAdditionalRelationOption {
    nullable?: boolean;
    deleteOption?: ReferenceOption;
    updateOption?: ReferenceOption;
}
