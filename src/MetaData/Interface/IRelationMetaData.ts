import { CompleteRelationshipType, ReferenceOption, RelationshipType } from "../../Common/StringType";
import { StringKeyOf, ValueType } from "../../Common/Type";
import { Enumerable } from "@elcy/enumerable";
import { IBaseRelationMetaData } from "./IBaseRelationMetaData";
import { IColumnMetaData } from "./IColumnMetaData";
import { IEntityMetaData } from "./IEntityMetaData";
import { IRelationDataMetaData } from "./IRelationDataMetaData";

export interface IRelationMetaData<TSource extends object = object, TTarget extends object = object, TRel extends RelationshipType = RelationshipType> extends IBaseRelationMetaData<TSource, TTarget> {
    completeRelationType?: CompleteRelationshipType;
    deleteOption?: ReferenceOption;
    fullName: string;
    isMaster: boolean;

    // Helper property to improve hydration performance issue
    /**
     * Column used in relation that has been mapped to an entity's property.
     */
    mappedRelationColumns?:  Enumerable<IColumnMetaData<TSource, ValueType>>;
    name?: string;
    nullable?: boolean;
    propertyName?: StringKeyOf<TSource>;
    relationColumns: Array<IColumnMetaData<TSource, ValueType>>;
    relationData?: IRelationDataMetaData<any, TSource, TTarget> | IRelationDataMetaData<any, TTarget, TSource>;
    relationMaps?: Map<IColumnMetaData<TSource, ValueType>, IColumnMetaData<TTarget, ValueType>>;
    relationType: TRel;
    reverseRelation?: IRelationMetaData<TTarget, TSource>;
    source: IEntityMetaData<TSource>;
    target: IEntityMetaData<TTarget>;
    updateOption?: ReferenceOption;
    completeRelation?(reverseRelation: IRelationMetaData<TTarget, TSource>): void;
}
