import { IObjectType, ReferenceOption, RelationshipType } from "../../Common/Type";

export interface IRelationOption<TSource, TTarget> {
    sourceType?: IObjectType<TSource>;
    targetType: IObjectType<TTarget>;
    metaType?: IObjectType;
    relationKeys?: Array<keyof TSource | ((source: TSource) => any)>;
    name?: string;
    // used for sql foreign key constraint name
    relationKeyName?: string;
    isMaster: boolean;
    updateOption?: ReferenceOption;
    deleteOption?: ReferenceOption;
    relationType: RelationshipType | "one?";
    manyToManyMapName: string;
    propertyName?: keyof TSource;
    nullable?: boolean;
}
