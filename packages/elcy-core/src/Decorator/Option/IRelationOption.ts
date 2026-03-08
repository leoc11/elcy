import { IColumnMetaData } from "src/MetaData/Interface/IColumnMetaData";
import { ReferenceOption, RelationshipType } from "../../Common/StringType";
import { IObjectType, PropertySelector } from "../../Common/Type";
import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";

export interface IRelationData<TSource extends object, TTarget extends object> {
    name: string;
    metaData: IEntityMetaData<TSource>;
    propertyName: keyof TSource;
    isMaster: boolean;

    targetMetaData?: IEntityMetaData<TTarget>;
    relationMap?: Map<IColumnMetaData<TSource>, IColumnMetaData<TTarget>>;
    relationType?: RelationshipType;
    nullable?: boolean;
    // used for sql foreign key constraint name
    relationKeyName?: string;
    deleteOption?: ReferenceOption;
    updateOption?: ReferenceOption;
}
export interface IRelationOption<TSource, TTarget> extends IAdditionalRelationOption {
    name: string;
    relationMap: Map<PropertySelector<TSource>, PropertySelector<TTarget>>;
    // used for sql foreign key constraint name
    relationKeyName?: string;
}
export interface IAdditionalRelationOption {
    deleteOption?: ReferenceOption;
    updateOption?: ReferenceOption;
}
